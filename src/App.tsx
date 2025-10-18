import { BrowserRouter as Router } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4">
          <h1 className="text-4xl font-bold text-center mt-8">
            Couple Bucks
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            Shared Finance Management for Couples
          </p>
        </div>
      </div>
    </Router>
  )
}

export default App
