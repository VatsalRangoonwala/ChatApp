self.addEventListener("push", function(event) {

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: "",
    badge: "",
    data: {
      chatId: data.chatId
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );

});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const chatId = event.notification.data.chatId;

  event.waitUntil(
    clients.openWindow("/")
  );
});