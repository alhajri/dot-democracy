import React from "react";

import { AlertToaster } from "meteor/empirica:core";
import { Icon, Button, Card, Elevation } from "@blueprintjs/core";
import { shuffle } from "shuffle-seed";

export default class SocialInteraction extends React.Component {

  renderAlter(otherPlayer) {
    const { round, game } = this.props;
    const cumulativeScore = otherPlayer.get("cumulativeScore") || 0;
    const roundScore = otherPlayer.round.get("score") || 0;

    const feedbackTime = round.get("displayFeedback");
    const peersFeedback = game.treatment.peersFeedback;

    return (
      <Card className={"alter"} elevation={Elevation.TWO} key={otherPlayer._id}>
        <div className="info">
          <img src={otherPlayer.get("avatar")} className="profile-avatar" />
          {/*only show the scores of the alters if feedback is allowed*/}
          {feedbackTime && peersFeedback ? (
            <div>
              <Icon icon={"dollar"} />
              <span style={{ color: otherPlayer.get("arrowColor") }}>
                {cumulativeScore}
              </span>
            </div>
          ) : null}
        </div>
      </Card>
    );
  }

  renderAltersList(alterIds) {
    return alterIds.map(alterId => this.renderAlter(alterId));
  }

  renderLeftColumn(player, alterIds, feedbackTime) {
    const { game } = this.props;
    const cumulativeScore = player.get("cumulativeScore") || 0;
    const roundScore = player.round.get("score") || 0;
    const peersFeedback = game.treatment.peersFeedback;

    return (
      <div className="right" key="left" style={{ minWidth: "18rem" }}>
        {feedbackTime && peersFeedback ? (null
        ) : null}

        <p>
          <strong>You are following:</strong>
        </p>
        {this.renderAltersList(alterIds)}
      </div>
    );
  }

  render() {
    const { game, player, round } = this.props;

    const feedbackTime = round.get("displayFeedback");

    //get the ids of the followers and the people that they could follow
    const alterIds = Array.from(new Set(player.get("alterIds"))); //this protect us from double clicking that might cause follwoing the same player twice

    //actual Player objects and not only Ids for alters and nonAlters

    //all players sorted by performance in descending order if feedback, otherwise, shuffle them
    const allPlayers =
      feedbackTime && game.treatment.peersFeedback
        ? _.sortBy(game.players, p => p.get("cumulativeScore")).reverse()
        : shuffle(game.players, player._id);

    const alters = allPlayers.filter(p => alterIds.includes(p._id));

    return (
      <div className="social-interaction">
        { this.renderLeftColumn(player, alters, feedbackTime)}
      </div>
    );
  }
}

// ES6 code to reduce the rat of calling a function
function throttled(delay, fn) {
  _.throttle(fn, delay);
}
