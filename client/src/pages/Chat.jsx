import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const textboxRef = useRef('');
    const socketRef = useRef(null);

    useEffect(() => {
        socketRef.current = io("http://localhost:5010");

        socketRef.current.on('message', (msg) => {
            console.log(msg);
            setMessages((prevMsg) => [...prevMsg, msg]);
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    const sendMessage = (e) => {
        if (e.key === "Enter") {
            socketRef.current?.emit('message', textboxRef.current.value);
            textboxRef.current.value = '';
        }
    }

    return (
        <div style={{ padding: '40px'}}>
            <h1>Chat Group</h1>
            <ul>
                {messages.map((msg, index) => (
                    <li key={index}>{msg}</li>
                ))}
            </ul>
            <textarea ref={textboxRef} onKeyDown={sendMessage} style={{ border: '1px solid #ccc'}}></textarea>
        </div>
    );
}

export default Chat;