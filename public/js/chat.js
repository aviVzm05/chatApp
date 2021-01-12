const socket = io();

// server (emit) -> client (receive) -> acknowledgement -> server
// client (emit) -> server (receive) -> acknowledgement -> client

// Elements:
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options

const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})  
// QS - query sring JS library to parse the form data... 
/*
sample data: 
location.search
"?username=avi.vzm05%40gmail.com&roomname=121"
ignoreQueryPrefix -  to ignore the ?
*/

const autoScroll = () =>{
    // new message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}


socket.on('message', (message)=>{
    // console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message : message.text,
     //   createdAt: message.createdAt  // create date is a string value like '123444444' 
                                      // representing time from 1st of jan 1970.
                                      // this needs to be formated to display correctly and for this
                                      // we use moment library - js lib added in index.html
        createdAt: moment(message.createdAt).format('hh:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('locationMessage',(message) =>{
    const html = Mustache.render(locationTemplate,{
        username: message.username,
        location: message.url,
        createdAt: moment(message.createdAt).format('hh:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll();
})

$messageForm.addEventListener('submit',(e) => {
    e.preventDefault();
    //Disable the button 
    $messageFormButton.setAttribute('disabled','disabled');

    const message = $messageFormInput.value;
    socket.emit('sendMessage', message , (error)=> {    // function is going to run as part of acknowledgement
        // enable the button back
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if (error) {
            return console.log(error)
        }
        console.log('message delivered');
    });
});

$locationButton.addEventListener('click', () => {
    // if this object is not there... browser does not have suppot...
    if (!navigator.geolocation) {
        return alert(' Geo location is not supported by your browser')
    } 

    //disable the button when the data is being fetched
    $locationButton.setAttribute('disabled','disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        },()=> {
            // call back function which would be called from server, as an acknowledgement
            console.log('Your location is now shared with all connected clients');
            // once we have confirmation that locaiton info is shared, enable the button
            $locationButton.removeAttribute('disabled');
        });
    })
});

socket.emit('join', {
    username,
    room
}, (error) => {
    if (error) {
        alert('error');
        location.href = '/';
    }
});

socket.on('roomData', ({ room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    document.querySelector('#sidebar').innerHTML = html;
})