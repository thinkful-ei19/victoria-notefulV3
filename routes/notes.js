'use strict';

const express = require('express');

const mongoose = require('mongoose');
const Note = require('../models/note');

const router = express.Router();
/* ========== GET/READ ALL ITEM ========== */
router.get('/notes', (req, res, next) => {
    const searchTerm = req.query.searchTerm;
    let filter = {};

    if (searchTerm) {
      const re = new RegExp(searchTerm, 'i');
      filter.title = { $regex: re };
    }

    return Note.find(filter)
      .sort('created')
      .then(results => {
        res.json(results);
      })
      .catch(next);
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/notes/:id', (req, res, next) => {
    const id = req.params.id;
    return Note.findById(id)
      .then(result => {
       if (result) {
         res.json(result);
       } else {
        res.status(400).json({ message: 'The `id` is not valid' })
      }
    })
      .catch(err => {
        next(err);
      });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content, id } = req.body;

  const newNote = {
    title: title,
    content: content,
    id: id
  };

  if (!req.body.title) {
  const err = new Error('Missing `title` in request body');
    err.status = 400;
   return next(err);
  }

  return Note.create(newNote)
    .then(results => {
      res.location(`/api/notes/${id}`).status(201).json(results)
    })
    .catch(err => {
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {

  const id = req.params.id;
  const { title, content} = req.body;
  const options = { new: true };
  const updateNote = {
    title: title,
    content: content
  };

   return Note.findByIdAndUpdate(id, updateNote, options)
     .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const id = req.params.id;
  return Note.findByIdAndRemove(id)
      .then(results => {
        res.status(204).end();
      })
      .catch(err => {
        next(err);
      });
});

module.exports = router;
