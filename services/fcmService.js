const admin = require('firebase-admin');
const serviceAccount = require('../evntown-b5f0e-firebase-adminsdk-ccq7c-e12144ee2a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendNotification = (token, title, body) => {
  const message = {
    notification: {
      title,
      body,
    },
    token,
  };

  admin
    .messaging()
    .send(message)
    .then(response => {
      console.log('Notification sent successfully:', response);
    })
    .catch(error => {
      console.error('Error sending notification:', error);
    });
};

// subscribe to topic
const subscribeToTopic = (token, topic) => {
  console.log('token:', token);
  console.log('topic:', topic);
try {
  admin
  .messaging()
  .subscribeToTopic(token, topic)
  .then(() => {
    console.log('Subscribed to topic:', topic);
  })
  .catch(error => {
    console.error('Error subscribing to topic:', error);
  });
} catch (error) {
  console.log(error);
  
}
};

// unsubscribe from topic
const unsubscribeFromTopic = (token, topic) => {
  admin
    .messaging()
    .unsubscribeFromTopic(token, topic)
    .then(() => {
      console.log('Unsubscribed from topic:', topic);
    })
    .catch(error => {
      console.error('Error unsubscribing from topic:', error);
    });
};
// send message to topic
const sendToTopic = (topic, title, body) => {
  const message = {
    notification: {
      title,
      body,
    },
    topic,
  };

  admin
    .messaging()
    .send(message)
    .then(response => {
      console.log('Notification sent successfully:', response);
    })
    .catch(error => {
      console.error('Error sending notification:', error);
    });
};


module.exports = { sendNotification, subscribeToTopic, unsubscribeFromTopic, sendToTopic };
