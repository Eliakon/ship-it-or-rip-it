const _ = require('underscore');
const express = require('express');
const goodreads = require('goodreads');
const htmlparser = require("htmlparser2");
const request = require('request');
const APIKeys = require('./APIKeys');

const LIBRARYTHING_URL = 'http://www.librarything.com/api/thingTitle/';
const THROTTLE_DURATION = 1000;

const app = express();
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const gr = new goodreads.client({
  key: APIKeys.goodreadsKey,
  secret: APIKeys.goodreadsSecret
});

app.get('/:id', function(req, res) {
  if (!req.params.id.match(/^(\d)+$/g))
  {
    res.send({ success: false, message: 'No valid userid provided'});
    res.end();
  }
  else
  {
    throttledGetSingleShelf(req.params.id, res);
  }
});

const throttledGetSingleShelf = _.throttle(function(userId, res) {
  gr.getSingleShelf({
    id: userId,
    page: 1,
    per_page: 200,
    shelf: 'read'
  }, function(json) {
    if (json.hasOwnProperty('success') && !json.success)
    {
      res.send({ success: false, message: 'User unknown'});
    }
    else
    {
      res.send(getBooksList(json.GoodreadsResponse.books[0].book));
    }
    res.end();
  });
}, THROTTLE_DURATION);

function getBooksList(readShelf) {
  var json = {
    success: true,
    books: readShelf.map((item) => { return item.title[0] })
  };
  return json;
}

app.get('/getLibraryThingInfo/:title', function(req, res) {
  var title = req.params.title.replace(/[^\w\s]/gi, ' ');
  throttledGetLibraryThingUrl(title, res);
});

const parseLibraryThingPage = (url, title, res) => {
  request(`${url}/commonknowledge`, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      res.send({ success: false, message: 'Couldn\'t parse LibraryThing page' });
    }
    else {
      let getText = false;
      let book = {
        title: title,
        characters: [],
        coverUrl: ''
      };

      const parser = new htmlparser.Parser({
        onopentag: (name, attrs) => {
          if (name === 'a' && attrs.hasOwnProperty('href') && attrs.href.substring(0, 11) === '/character/') {
            getText = true;
          }
          else if (name === 'img' && attrs.hasOwnProperty('class') && attrs.class === 'workCoverImage') {
            book.coverUrl = attrs.src;
          }
        },
        ontext: (text) => {
          if (getText) {
            book.characters.push(text);
            getText = false;
          }
        },
        onend: () => {
          res.send({success: true, bookData: book});
          res.end();
        }
      }, {decodeEntities: true});
      parser.write(body);
      parser.end();
    }
  });
};

const throttledGetLibraryThingUrl = _.throttle(function(title, res) {
  request(LIBRARYTHING_URL + title, (error, response, body) => {
    if (error || response.statusCode !== 200)
    {
      res.send({ success: false, message: 'Error'});
      res.end();
      return;
    }

    var rx = /http:\/\/www.librarything.com\/work\/(\d)+/g;
    var link = rx.exec(body);

    if (null === link)
    {
      res.send({ success: false, message: 'No link found' });
      res.end();
    }
    else
    {
      parseLibraryThingPage(link[0], title, res);
    }
  });
}, THROTTLE_DURATION);

app.listen(3030);
