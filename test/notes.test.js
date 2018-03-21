'use strict';
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const express = require('express');

const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const seedNotes = require('../db/seed/notes');

const expect = chai.expect;

chai.use(chaiHttp);


describe('Notes API resource', function() {

  before(function () {
    console.log(TEST_MONGODB_URI, 'TEST URL CONSOLE')
     return mongoose.connect(TEST_MONGODB_URI);
   });

   beforeEach(function () {
     return Note.insertMany(seedNotes)
       .then(() => Note.createIndexes());
   });

   afterEach(function () {
     return mongoose.connection.db.dropDatabase();
   });

   after(function () {
     return mongoose.disconnect();
   });

  describe('POST /api/notes', function () {
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'The best article about cats ever!',
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...',
        // 'tags': []
      };
      let body;
      // 1) First, call the API
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('id', 'title', 'content');
          // 2) **then** call the database
          return Note.findById(body.id);
        })
        // 3) **then** compare
    .then(data => {
      expect(body.title).to.equal(data.title);
      expect(body.content).to.equal(data.content);
      });
    });
  });

  describe('GET /api/notes', function () {
  it('should return the correct number of Notes', function () {
    // 1) Call the database and the API
    const dbPromise = Note.find();
    const apiPromise = chai.request(app).get('/api/notes');
    // 2) Wait for both promises to resolve using `Promise.all`
    return Promise.all([dbPromise, apiPromise])
    // 3) **then** compare database results to API response
      .then(([data, res]) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
        expect(res.body).to.have.length(data.length);
      });
    });
  });

  describe('GET /api/notes/:id', function () {
    it('should return correct notes', function () {
      let data;
      // 1) First, call the database
      return Note.findOne().select('id title content')
        .then(_data => {
          data = _data;
          // 2) **then** call the API
          return chai.request(app).get(`/api/notes/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'created', 'content');
          // 3) **then** compare
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
        });
    });
  })

  describe('PUT /api/notes/:id', function() {
    it('should update notes', function () {
    const updateNote = {
      'title': 'Cat Love',
      'content': 'Why do cats purr?'
    };

    let data;
    return Note.findOne().select('id title content')
      .then(_data => {
        data = _data;
        return chai.request(app)
          .put(`/api/notes/${data.id}`)
          .send(updateNote);
      })
      .then((res) => {
         expect(res).to.have.status(200);
         expect(res).to.be.json;
         expect(res.body).to.be.a('object');
         expect(res.body).to.include.keys('id', 'title', 'content');

         expect(res.body.id).to.equal(data.id);
         expect(res.body.title).to.equal(updateNote.title);
         expect(res.body.content).to.equal(updateNote.content);
       });
    });

    it('should respond with a 404 for an invalid id', function () {
      const updateItem = {
        'title': 'Cat Love',
        'content': 'Why do cats purr?'
      };

      return chai.request(app)
        .put('/api/notes/AAAAAAAAAAAAAAAAAAAAAAAA')
        .send(updateItem)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });

  describe('DELETE  /api/notes/:id', function () {

    it('should delete an item by id', function () {
      let data;
      return Note.findOne().select('id title content')
        .then(_data => {
          data = _data;
          return chai.request(app).delete(`/api/notes/${data.id}`);
        })
        .then(function (res) {
          expect(res).to.have.status(204);
        });
    });

    it('should respond with a 204 for an invalid id', function () {

      return chai.request(app)
        .delete('/api/notes/AAAAAAAAAAAAAAAAAAAAAAAA')
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(204);
        });
    });
  });
})
