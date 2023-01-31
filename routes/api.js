/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';

const URI = process.env.DB;

const { MongoClient, ObjectId } = require('mongodb');

// Create a new MongoClient
const client = new MongoClient(URI);

const database = client.db('library');
const booksCollection = database.collection('books');

module.exports = function (app) {
  app
    .route('/api/books')
    .get(async function (req, res) {
      const books = await booksCollection.find().toArray();
      res.status(200).json(books);
    })

    .post(async function (req, res) {
      let title = req.body.title;
      if (!title) {
        res.status(200).send('missing required field title');
        return;
      }
      const data = await booksCollection.insertOne({
        title,
        comments: [],
        commentcount: 0,
      });

      const book = await booksCollection.findOne({
        _id: data.insertedId,
      });

      res.status(200).json({ _id: book._id, title: book.title });
    })

    .delete(async function (req, res) {
      await booksCollection.deleteMany({}, (err) => {
        if (err) {
          res.status(200).send('Error');
          return;
        }
        res.status(200).send('complete delete successful');
      });
    });

  app
    .route('/api/books/:id')
    .get(async function (req, res) {
      let bookid = req.params.id;

      if (!ObjectId.isValid(bookid)) {
        console.log('isValid failed');
        res.status(200).send('no book exists');
        return;
      }
      const book = await booksCollection.findOne({ _id: ObjectId(bookid) });
      if (!book) {
        res.status(200).send('no book exists');
        return;
      }
      res.status(200).json(book);
    })

    .post(async function (req, res) {
      let bookid = req.params.id;

      if (!ObjectId.isValid(bookid)) {
        console.log('isValid failed');
        res.status(200).send('no book exists');
        return;
      }

      let comment = req.body.comment;
      if (!comment) {
        res.status(200).send('missing required field comment');
        return;
      }
      const book = await booksCollection.findOne({ _id: ObjectId(bookid) });

      if (!book) {
        res.status(200).send('no book exists');
        return;
      }

      const updateDoc = {
        $push: { comments: comment },
        $inc: { commentcount: 1 },
      };
      await booksCollection.updateOne({ _id: ObjectId(bookid) }, updateDoc, {
        upsert: true,
      });

      const updatedBook = await booksCollection.findOne({
        _id: ObjectId(bookid),
      });
      res.status(200).json(updatedBook);
    })

    .delete(async function (req, res) {
      let bookid = req.params.id;
      if (!ObjectId.isValid(bookid)) {
        res.status(200).send('no book exists');
        return;
      }
      const todelete = await booksCollection.findOne({ _id: ObjectId(bookid) });
      if (!todelete) {
        res.status(200).send('no book exists');
        return;
      }
      await booksCollection.deleteOne({ _id: ObjectId(bookid) });
      res.status(200).send('delete successful');
    });
};
