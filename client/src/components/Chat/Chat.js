import React, { useState, useEffect } from 'react';
import queryString from 'query-string'; //That will help use retrieving data from URL
import io from 'socket.io-client';
import './Chat.css';
import InfoBar from '../InfoBar/InfoBar';
import Input from '../Input/Input';
import Messages from '../Messages/Messages';
import TextContainer from '../TextContainer/TextContainer';

let socket; 

const Chat = ({ location }) => {
    const [name, setName] = useState('');
    const [room, setRoom] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState('');
    const ENDPOINT = 'localhost:5000';

    //What is going to run when the component render
    //location.search come from react-router and it's give a props call location
    useEffect(() => {
        const { name, room } = queryString.parse(location.search);
        
        socket = io(ENDPOINT);

        setName(name);
        setRoom(room);

        socket.emit('join', { name, room }, (error) => {
            if(error) {
                alert(error);
            }
        });//With callback, we have now 3 parameters in this function

        //This return will be happening  on Onmount, when we'll leaving the chat
        return () => {
            socket.emit('disconnect');

            socket.off();
        }
    }, [ENDPOINT, location.search]);

    useEffect(() => {
        socket.on('message', (message) => {
            //This is adding new message added in the array
            setMessages([...messages, message])
        });

        socket.on('roomData', ({ users }) => {
            setUsers(users);
        })

    }, [messages]);

    //Function to send messages
    const sendMessage = (event) => {
        event.preventDefault();

        if(message) {
            socket.emit('sendMessage', message, () => setMessage(''));
            const split = message.split(' ');

            socket.on('nick', () => {
                if(split[0] === '/nick') {
                    if(split[1]) {
                        setName(split[1])
                    }
                }
            });

            socket.on('nickroom', () => {
                if(split[0] === '/nickroom') {
                    if(split[1]) {
                        setRoom(split[1])
                    }
                }
            });

            socket.on('leave', () => {
                setRoom('room_default');
            })

            socket.on('join', () => {
                setRoom(split[1]);
            })

        }
    }

    // console.log(message, messages)

    return(
        <div className="outerContainer">
            <div className="container">
                <InfoBar room={room} />
                <Messages messages={messages} name={name}/>
                <Input message={message} setMessage={setMessage} sendMessage={sendMessage} />
            </div>
            <TextContainer users={users}/>
        </div>
    )
}

export default Chat;