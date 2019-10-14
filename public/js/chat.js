const socket = io()

// === elements ===
const $messageForm = document.querySelector('#msg-form') 
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// === templates ===
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// === options ===
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoScroll = () => {
  // new message element
  const $newMessage = $messages.lastElementChild

  // get height of newMessage
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // visible height
  const visibleHeight = $messages.offsetHeight

  // height of messages container
  const containerHeight = $messages.scrollHeight

  // how far have I scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    console.log('SCROLL HIT')
    // $messages.scrollTop = $messages.ScrollHeight
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

socket.on('locationMessage', (message) => {
  html = Mustache.render(locationTemplate, {

    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('h:mm a')
  })

  $messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })

  document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (event) => {
  event.preventDefault()

  // disable
  $messageFormButton.setAttribute('disabled', 'disabled')
  const message = event.target.elements.text.value
  
  socket.emit('sendMessage', message, (error) => {
    // enable
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()

    if(error) {
      return console.log(error)
    }

    console.log('Message delivered')
  })
})

$sendLocationButton.addEventListener('click', () => {
  if(!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser')
  }
  $sendLocationButton.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition((possition) => {
    const {latitude, longitude} = possition.coords

    socket.emit('sendLocation', { latitude, longitude }, () => {
      $sendLocationButton.removeAttribute('disabled') 
      console.log('Location shared') 
    })
  })
})

socket.emit('join', {
  username,
  room
}, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})