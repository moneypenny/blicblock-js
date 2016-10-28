const COLS = 5
const ROWS = 7
const MIDDLE_COL_IDX = (COLS - 1) / 2

class BoardContainer extends React.Component {
  constructor() {
    super()
    this.state = {
      inProgress: true,
      gameOver: false,
      currentScore: 0,
      level: 1,
      submittedScore: false,
      testMode: false,
      blocks: [],
      upcoming: [new Block(), new Block()],
      tickLength: 1200, // ms
      checking: false,
    }
  }

  componentDidMount() {
    const gameInterval = setInterval(() => this.gameLoop(),
                                     this.state.tickLength)
    this.setState({ gameInterval })
  }

  componentWillUnmount() {
    this.cancelGameInterval()
  }

  gameLoop() {
    if (!this.state.inProgress) {
      return
    }
    if (this.state.plummettingBlock || this.state.slidingBlock) {
      return
    }
    this.dropBlocks()
    this.dropQueuedBlockIfNoActive()
  }

  dropBlocks() {
    const lastRowX = ROWS - 1
    const blocks = this.state.blocks.map(block => {
      if (block.sliding) {
        return block
      }
      const attrs = block.attrs()
      if (attrs.active || !attrs.locked) {
        if (attrs.x === lastRowX) {
          attrs.locked = true
          attrs.active = false
          attrs.highlight = true
        }
        if (this.isBlockDirectlyBelow(attrs.x, attrs.y)) {
          attrs.locked = true
          attrs.active = false
        }
      }
      if (!attrs.locked) {
        attrs.x++
      }
      return new Block(attrs)
    })
    this.setState({ blocks }, () => this.onBlocksDropped())
  }

  isBlockDirectlyBelow(x, y) {
    const matching = this.state.blocks.filter(block => {
      return block.x === x + 1 && block.y === y
    })
    return matching.length > 0
  }

  onBlocksDropped() {
    this.deHighlightBlocks()
    this.checkForTetrominos()
  }

  checkForTetrominos() {

  }

  deHighlightBlocks() {
    setTimeout(() => {
      const blocks = this.state.blocks.map(block => {
        if (block.highlight) {
          const attrs = block.attrs()
          attrs.highlight = false
          return new Block(attrs)
        }
        return block
      })
      this.setState({ blocks })
    }, this.state.tickLength * 0.21)
  }

  dropQueuedBlockIfNoActive() {
    const activeBlocks = this.state.blocks.filter(block => block.active)
    if (activeBlocks.length > 0) {
      return
    }
    this.dropQueuedBlock()
  }

  dropQueuedBlock() {
    if (this.state.checking) {
      return
    }
    const middleColBlocks = this.state.blocks.filter(block => {
      return block.y === MIDDLE_COL_IDX
    })
    if (middleColBlocks.length >= ROWS) {
      this.gameOver()
      return
    }
    const x = 0
    const y = MIDDLE_COL_IDX
    const topMidBlock = this.state.blocks.filter(block => {
      return block.x === x && block.y === y
    })[0]
    if (topMidBlock) {
      return // Currently dropping or sliding at the top
    }
    const attrs = this.state.upcoming[0].attrs()
    attrs.x = x
    attrs.y = y
    const block = new Block(attrs)
    const upcoming = [this.state.upcoming[1], new Block()]
    this.setState({ upcoming, blocks: this.state.blocks.concat([block]) })
  }

  gameOver() {
    this.setState({ inProgress: false, gameOver: true })
    this.cancelGameInterval()
    this.saveHighScore()
  }

  cancelGameInterval() {
    clearInterval(this.state.gameInterval)
  }

  saveHighScore() {
    if (this.state.testMode) {
      return
    }
    // TODO
  }

  containerClass() {
    const classes = ['board-container']
    if (this.state.testMode) {
      classes.push('test-mode')
    }
    if (this.state.gameOver) {
      classes.push('game-over')
    }
    if (this.state.inProgress) {
      classes.push('in-progress')
    } else {
      classes.push('paused')
    }
    return classes.join(' ')
  }

  render () {
    const { currentScore, level, inProgress, gameOver, submittedScore,
            testMode, blocks } = this.state
    const existingHighScore = LocalStorage.get('high_score') || {}
    const newHighScore = {}
    if (existingHighScore.value && currentScore > existingHighScore.value) {
      newHighScore.value = currentScore
    }
    return (
      <div className={this.containerClass()}>
        <div className="score">{currentScore}</div>
        <div className="level">{level}</div>
        <Board blocks={blocks} />
        <BlockPreview />
        <GameMessage
          inProgress={inProgress}
          gameOver={gameOver}
          currentScore={currentScore}
          submittedScore={submittedScore}
          testMode={testMode}
          newHighScore={newHighScore}
          existingHighScore={existingHighScore}
          startNewGame={() => this.startNewGame()}
        />
      </div>
    )
  }
}
