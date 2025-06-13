import React, { useEffect, useState } from 'react'
import './App.css'
import PositionDescriptionUpload from './components/PositionDescriptionUpload'

function App() {
  const [greeting, setGreeting] = useState('Loading...')

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/content/greeting')
        const data = await response.json()
        setGreeting(data.value)
      } catch (error) {
        console.error('Error fetching greeting:', error)
        setGreeting('Error loading content')
      }
    }

    fetchGreeting()
  }, [])

  return (
    <div className="App">
      <PositionDescriptionUpload />
      <h1>{greeting}</h1>
    </div>
  )
}

export default App 