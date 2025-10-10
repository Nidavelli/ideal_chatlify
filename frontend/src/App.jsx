import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

// Client selects a random server from a list. You can set SERVERS in the build or
// use the default hardcoded list for local testing.
const DEFAULT_SERVERS = [
  'http://localhost:3010',
  'http://localhost:3011',
  'http://localhost:3012'
];

function pickRandom(servers) {
  return servers[Math.floor(Math.random() * servers.length)];
}

function App() {
  const [name, setName] = useState('')
  const [connectedServer, setConnectedServer] = useState(null)
  const [servers] = useState(() => {
    try {
      const env = (import.meta.env.VITE_SERVERS || '').split(',').map(s=>s.trim()).filter(Boolean);
      return env.length ? env : DEFAULT_SERVERS;
    } catch (e) { return DEFAULT_SERVERS }
  })

  const socketRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [connected, setConnected] = useState(false)
  const [users, setUsers] = useState([])
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    // cleanup on unmount
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    }
  }, [])

  function connectToRandomServer() {
    const server = pickRandom(servers)
    setConnectedServer(server)
    if (socketRef.current) {
      try { socketRef.current.disconnect(); } catch (e) {}
    }
    const socket = io(server, { reconnectionAttempts: 3, timeout: 5000 })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('connected to', server)
      setConnected(true)
      // set username if available and fetch users
      if (name) {
        socket.emit('set_username', name)
        fetchUsersFromServer(server).catch(()=>{})
      } else {
        fetchUsersFromServer(server).catch(()=>{})
      }
    })

    socket.on('message_log', (log) => {
      setMessages(log || [])
    })

    socket.on('users', (u) => {
      setUsers(u || [])
    })

    socket.on('chat_message', (msg) => {
      setMessages(m => [...m, msg])
    })

    socket.on('disconnect', (reason) => {
      console.warn('disconnected from', server, reason)
      setConnected(false)
      // attempt failover to another server
      const other = servers.filter(s => s !== server)
      if (other.length) setTimeout(() => connectToRandomServer(), 500)
    })

    socket.on('connect_error', (err) => {
      console.warn('connect_error', err.message)
      // try another server
      setConnected(false)
      const other = servers.filter(s => s !== server)
      if (other.length) setTimeout(() => connectToRandomServer(), 300)
    })

    // fallback helper: query server REST endpoint for connected users
    async function fetchUsersFromServer(srv) {
      try {
        const res = await fetch(`${srv}/internal/users`);
        if (!res.ok) return;
        const data = await res.json();
        setUsers(data || []);
      } catch (e) {
        console.warn('could not fetch users from', srv, e && e.message)
      }
    }
  }

  function joinChat() {
    if (!name.trim()) { alert('Please enter a name'); return }
    setJoined(true)
    connectToRandomServer()
  }

  useEffect(()=>{
    if (joined && socketRef.current && name) {
      socketRef.current.emit('set_username', name)
    }
  }, [name, joined])

  function sendMessage() {
    if (!joined) { alert('Please join the chat first'); return }
    if (!socketRef.current || !text.trim()) return
    const payload = { from: name || 'Anonymous', text: text.trim() }
    socketRef.current.emit('chat_message', payload)
    // optimistic UI
    setMessages(m => [...m, { ...payload, sentAt: new Date().toISOString(), id: 'local-' + Date.now() }])
    setText('')
  }

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="header-left">
          <h2>KIRINYAGA STUDENTS CHAT CENTER</h2>
          <p className="sub">Distributed Real-time Messaging</p>
        </div>
        <div className="header-right">
          <div className="connection-status">
            <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></div>
            <span className="status-text">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

      <main className="chat-main">
        <aside className="chat-sidebar">
          <div className="sidebar-section">
            <h4>Online Users</h4>
            <ul className="user-list">
              {users && users.filter(u=>u.username && u.username!=='Anonymous').length===0 && (
                <li className="user-item">No users connected</li>
              )}
              {users && users.filter(u=>u.username && u.username!=='Anonymous').map(u=> (
                <li key={u.id} className="user-item">
                  <span className={`user-dot ${u.username===name ? 'you' : 'online'}`}></span>
                  <span className="user-name">{u.username}</span>
                </li>
              ))}
            </ul>
          </div>

          <hr />

          <div className="sidebar-section">
            <h4>Server Info</h4>
            <div className="server-info">
              <p><strong>Node:</strong> <span>{connectedServer || '—'}</span></p>
              <p><strong>Messages:</strong> <span>{messages.length}</span></p>
              <p><strong>Users:</strong> <span>{users.filter(u=>u.username && u.username!=='Anonymous').length}</span></p>
            </div>
          </div>
        </aside>

        <section className="chat-content">
          <div className="chat-messages" id="messages-container">
            {messages.map(m => (
              <div key={m.id || m.sentAt || Math.random()} className={`message ${m.from===name ? 'message-own' : ''}`}>
                <div className="message-header">
                  <span className="message-username">{m.from}</span>
                  <span className="message-timestamp">{new Date(m.receivedAt || m.sentAt || Date.now()).toLocaleString()}</span>
                </div>
                <div className="message-content">{m.text}</div>
              </div>
            ))}
          </div>

          <div className="chat-input-area">
            <div id="username-section" style={{display: joined ? 'none' : 'block'}}>
              <label className="form-label">Choose Your Username</label>
              <div className="input-group">
                <input className="form-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your username..." maxLength={20} />
                <button className="btn btn-primary" onClick={joinChat}>Join Chat</button>
              </div>
            </div>

            <div id="message-section" style={{display: joined ? 'block' : 'none'}}>
              <div className="input-group">
                <input className="form-input" value={text} onChange={e=>setText(e.target.value)} placeholder="Type your message..." maxLength={1000} disabled={!joined} onKeyDown={e=>{ if(e.key==='Enter') sendMessage() }} />
                <button className="btn btn-primary" onClick={sendMessage} disabled={!joined}>Send</button>
              </div>
              <small>Logged in as: <strong>{name || '--'}</strong></small>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
