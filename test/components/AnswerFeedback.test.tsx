import { render, screen } from '../../src/test-utils.tsx'
import AnswerFeedback from '../../src/components/AnswerFeedback.tsx'

describe('AnswerFeedback', () => {
  it('stays empty when there is nothing to say', () => {
    const { container } = render(<AnswerFeedback message={null} negative={false} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('announces a wrong or failed submit assertively', () => {
    render(<AnswerFeedback message="Falsch" negative={true} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Falsch')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('announces a correct submit politely', () => {
    render(<AnswerFeedback message="Richtig!" negative={false} />)

    expect(screen.getByRole('status')).toHaveTextContent('Richtig!')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('replaces the previous message instead of stacking a second one', () => {
    const { rerender } = render(<AnswerFeedback message="Falsch" negative={true} />)

    rerender(<AnswerFeedback message="Freigeschaltet ab Stufe 13." negative={true} />)

    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByRole('alert')).toHaveTextContent('Freigeschaltet ab Stufe 13.')
  })
})
