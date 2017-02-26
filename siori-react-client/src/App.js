import React, { Component } from 'react';
import './App.css';
import { getBooks } from './APICalls.js';
import { getLibraryThingInfo } from './APICalls.js';

var books = [];
var chosenCharacters = [];
var goodreadsUserId;
var setBooksState;

class App extends Component {
  state = { type: 'login' }
  render() {
    setBooksState = () => { this.setState({ type: 'books' }) };
    if (this.state.type === 'books')
    {
      return (
        <div>
          <h1>Ship It Or Rip It</h1>
          <GoodreadsUserIdInput />

          <div className="books">
            <BookCharacter character={chosenCharacters[0]} />
            <BookCharacter character={chosenCharacters[1]} />
          </div>
        </div>
      );
    }

    return (
      <div>
        <h1>Ship It Or Rip It</h1>
        <GoodreadsUserIdInput />
      </div>
    );
  }
}

const getBookInfo = (book, callback) => {
  if (book.hasOwnProperty('bookData')) {
    callback(book.bookData);
    return;
  }
  getLibraryThingInfo(book.title, (json) => {
    if (undefined !== json && json.success) {
      callback(json.bookData);
    }
    callback();
  });
};

const chooseCharacter = book => {
  let characters = book.bookData.characters;
  if (undefined === book.bookData || book.bookData.characters.length < 1) {
    books.splice(books.indexOf(book), 1);
    chooseCharacters();
    return;
  }

  let character = characters[Math.floor(Math.random() * characters.length)];
  chosenCharacters.push({ name: character, book: book });
  chooseCharacters();
};

const chooseCharacters = () => {
  if (chosenCharacters.length < 2) {
    let bookIndex = Math.floor(Math.random() * books.length);
    getBookInfo(books[bookIndex], bookData => {
        if (undefined !== bookData) {
          books[bookIndex].bookData = bookData;
          chooseCharacter(books[bookIndex]);
        }
        else {
          chooseCharacters();
        }
      });
  }
  else {
    console.log(`Both characters chosen! (total ${chosenCharacters.length})`);
    console.log(`${chosenCharacters[0].name} from ${chosenCharacters[0].book.title} and ${chosenCharacters[1].name} from ${chosenCharacters[1].book.title}`);
    setBooksState();
  }
};

const chooseNewCharacters = () => {
  chosenCharacters = [];
  chooseCharacters();
};

const onGoodreadsIdSubmitted = (event, userId) => {
  event.preventDefault();

  if (goodreadsUserId === userId) {
    console.log(`user did not change ${userId}`);
    chooseNewCharacters();
    return;
  }

  console.log(`get read shelf for user ${userId}`);
  getBooks(userId, json => {
    if (json.success) {
      goodreadsUserId = userId;
      books = json.books.map((item) => { return { title: item } });
      chooseNewCharacters();
    }
  });
};

class GoodreadsUserIdInput extends Component {
  render() {
    return (
      <form onSubmit={(event) => { onGoodreadsIdSubmitted(event, this.textInput.value) }}>
        <input type="text" placeholder="My Goodreads Id" ref={input => { this.textInput = input }} />
      </form>
    );
  }
}

const BookCharacter = (props) => {
  return (
    <div className="book-character">
      <img src={props.character.book.bookData.coverUrl} />
      <p className="book-character-name">{props.character.name}</p>
      <p>from</p>
      <p className="book-title">{props.character.book.title}</p>
    </div>
  );
};

export default App;
