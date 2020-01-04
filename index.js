require('dotenv').config()

const { ApolloServer, gql } = require('apollo-server')
const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
const uuid = require('uuid/v1')

mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)

const MONGODB_URI = process.env.MONGODB_URI

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const typeDefs = gql`
  type Author {
    name: String
    born: Int
    bookCount: Int!
    id: ID
  }

  type Book {
    title: String!
    author: Author!
    published: Int!
    genres: [String!]!
    id: ID!
  }

  type Query {
    authorCount: Int!
    bookCount: Int!
    allBooks(author: String, genre: String): [Book]
    allAuthors: [Author!]!
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
  }
`

const resolvers = {
  Query: {
    authorCount: () => Author.collection.countDocuments(),
    bookCount: () => Book.collection.countDocuments(),
    allAuthors: () => Author.find({}),
    allBooks: async (root, args) => {
      const books = await Book.find({}).populate('author', { name: 1 })

      if (args.author) {
        const booksByAuthor = books.filter(book => book.author.name === args.author)
        return booksByAuthor
      }

      if (args.genre) {
        const booksByGenre = books.filter(book => book.genres.includes(args.genre))
        return booksByGenre
      } 

      return books
    }
  },
  Book: {
    author: root => {
      return {
        name: root.author.name
      }
    }
  },
  Author: {
    bookCount: async root => {
        const byAuthor = await Book.find({ author: root })
        return byAuthor.length
    }
  },
  Mutation: {
    addBook: async (root, args) => {
      let author = await Author.findOne({ name: args.author })
      
      if (!author) {
        author = new Author({
          _id: new mongoose.Types.ObjectId(),
          name: args.author
        })
        await author.save()
      }

      const book = new Book({ ...args, author: author._id })
      await book.save()

      return book
    },
    
    editAuthor: async (root, args) => {
      const filter = { name: args.name }
      const update = { born: args.setBornTo }

      let author = await Author.findOneAndUpdate(filter, update, {
        new: true
      })

      return author
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})