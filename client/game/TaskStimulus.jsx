import Board from "./Board";

import React from "react";

export default class TaskStimulus extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      //Do I really need the || 0 in "guess: props.player.round.get("guess") || 0"?
      guess: props.player.round.get("guess")
    };

    //this addition JUST to make the exported data easier. Without it, if a player DOES NOT change their answer in a stage, it will look 'empty' in the exported data
    //TODO: this should be moved to 'onStageStart' once it is implemented
    this.props.player.stage.set("guess", props.player.round.get("guess"));
  }

  get isIndividual() {
    //const { stage, game, player} = this.props;
    //if (stage.name === "outcome") {
    //  return;
    //}
   // const otherPlayer = game.players.find(
    //  p => stage.name.charAt(0) === p.get("name")
    //);
    //const alterIds = player.get("alterIds");
    //const feedbackTime = round.get("displayFeedback");
//
    ////all players sorted by performance in descending order if feedback, otherwise, shuffle but seed by player id (the same player will see the same order for the entire game
    //const allPlayers =
    //  feedbackTime && game.treatment.peersFeedback
    //    ? _.sortBy(game.players, p => p.get("cumulativeScore")).reverse()
    //    : shuffle(game.players, player._id);
    //const alters = allPlayers.filter(p => alterIds.includes(p._id));

    //return alterIds === player._id;
    return;
  }

  componentDidMount() {
    const guess = this.state.guess;
    //we always store at the round for reactivity but at the stage so we can see in the database
    //how they changed their answer from one stage to another
    //social guess will be static when appears to other players
    //see Board `renderAlterGuess`
    this.props.player.round.set("guess", guess);
    this.props.player.stage.set("guess", guess);
  }

  updateArrow = (guess, state) => {
    this.setState({ guess: guess });
    //up means mouse up
    if (state === "up") {
      //only save the score in the db when they put the mouse up
      //console.log("now will save");
      this.props.player.round.set("guess", guess);
      this.props.player.stage.set("guess", guess);
    }
  };

  alters() {
    const { game, stage, player } = this.props;

    if (this.isIndividual) {
      return [];
    }
    //const otherPlayer = game.players.find(
    //  p => stage.name.charAt(0) === p.get("name")
    //);
    const alterIds = player.get("alterIds");
    
    //all players sorted by performance in descending order if feedback, otherwise, shuffle but seed by player id (the same player will see the same order for the entire game
    const allPlayers = game.players;
    const alters = allPlayers.filter(p => alterIds.includes(p._id));
    //const otherPlayers = _.reject(game.players, p => p._id === player._id);
    return alters;
    
  }

  renderBoard() {
    const { round, stage, player } = this.props;

    const isOutcome = stage.name === "outcome";

    const task = round.get("task");
    const disabled = player.stage.submitted;
    const difficultlyLvls = task.answerProportion;

    return (
      <Board
        guess={this.state.guess}
        isOutcome={isOutcome}
        stage={stage}
        disabled={disabled}
        player={player}
        //alters={stage.name === "response" ? null : this.alters()}
        alters={stage.name === "response" ? null : this.alters()}
        stageName={stage.name}
        taskData={{
          answer: task.correctAnswer,
          answerProportion: difficultlyLvls[player.get("performance")],
          dotSpeed: task.dotSpeed,
          nDots: task.nDots
        }}
        actions={{
          updateArrow: this.updateArrow
        }}
      />
    );
  }

  render() {
    return <div className="task-stimulus">{this.renderBoard()}</div>;
  }
}

