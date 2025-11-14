import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

function ExampleComponent() {
  return <div>Hello Test</div>
}

describe('Example Component Test', () => {
  it('should render text', () => {
    render(<ExampleComponent />)
    expect(screen.getByText('Hello Test')).toBeInTheDocument()
  })
})
