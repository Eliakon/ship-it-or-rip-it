import request from 'request'

const host = 'http://localhost:3030/';

export const getBooks = (userId, callback) => {
  let url = host + userId;
  request(url, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      console.log('error :(');
      callback();
      return;
    }
    callback(JSON.parse(body));
  });
};

export const getLibraryThingInfo = (title, callback) => {
  let url = `${host}getLibraryThingInfo/${title}`;
  request(url, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      console.log('error :(');
      callback();
      return;
    }
    callback(JSON.parse(body));
  });
};
