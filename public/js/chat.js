const socket = io()

// Elements

const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $messageDiv = document.querySelector('#message-div')
const $message = document.querySelector('#message')

//Template
const messageTemplate = document.querySelector('#message-template')
const locationMessage = document.querySelector('#location-message')
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Class Message and Location
const messageContent = document.querySelector(".message")
const locationContent = document.querySelector(".location")


// Option
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

const userName = username.toLowerCase().trim()
const autoscroll = () => {

    const $newMessage = $messageDiv.lastElementChild

    // Height of new Message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible Height
    const visibleHeight = $messageDiv.offsetHeight

    // Height of Message container 
    const containerHeight = $messageDiv.scrollTop

    //How I have scrolled?
    const scrollOffset = $messageDiv.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messageDiv.scrollTop = $messageDiv.scrollHeight 
    }
}

function messageDisplay(message) {

}

socket.on("message", (message) => {

    if(userName == message.username) {
        messageContent.className = "message owner"
        
    } else {
        messageContent.className = "message other"
    }

    const html = Mustache.render(messageTemplate.innerHTML, {
        username: message.username,
        message:message.text,
        createdAt: moment(message.createdAt).format("h:mm A")
    })
    $messageDiv.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

socket.on('locationMessage', (url) => {

    if(userName == url.username) {
        locationContent.className = "location owner"
        console.log("if", locationContent.className)
        
    } else {
        locationContent.className = "location other"
        console.log("else")
    }

    // console.log(locationContent)
    const html = Mustache.render(locationMessage.innerHTML, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format("h:mm A")
    })
    $messageDiv.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const textValue = $messageFormInput.value

    socket.emit("sendMessage", textValue, () => {
        
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
       
    })
})

const $locationButton = document.querySelector("#send-location")

$locationButton.addEventListener("click", () => {
    $locationButton.setAttribute('disabled', 'disbaled')
    if(!navigator.geolocation) {
        return alert("Your browser does not support Location")
    } 
    
    navigator.geolocation.getCurrentPosition((position) => {
               socket.emit("sendLocation", {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }, () => {
                $locationButton.removeAttribute('disabled')
                console.log("Location is Shared")
            })

    })
})


socket.emit('join', { username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})