import Empirica from "meteor/empirica:core";

// onGameStart is triggered once per game before the game starts, and before
// the first onRoundStart. It receives the game and list of all the players in
// the game.
Empirica.onGameStart(game => {
  game.set("justStarted", true); // I use this to play the sound on the UI when the game starts

  console.log("game", game._id, "started");
});


// onRoundStart is triggered before each round starts, and before onStageStart.
// It receives the same options as onGameStart, and the round that is starting.
Empirica.onRoundStart((game, round) => {
    console.log("round", round.index, "started");
    game.players.forEach(player => {
      player.round.set("alterIds", player.get("alterIds"));
      player.round.set("guess", null);
      player.round.set("performance", player.get("performance"));
    });
  
    const feedbackTime =
      game.treatment.feedbackRate > 0 &&
      (round.index + 1) %
        Math.round(
          game.treatment.nRounds /
            (game.treatment.feedbackRate * game.treatment.nRounds)
        ) ===
        0;
    round.set("displayFeedback", feedbackTime);
    console.log("display feedback at round", round.index, "?", feedbackTime);
  });

Empirica.onGameStart(game => {
    game.set("justStarted", true); // I use this to play the sound on the UI when the game starts
  
    console.log("game", game._id, "started");
  });

// onRoundStart is triggered before each round starts, and before onStageStart.
// It receives the same options as onGameStart, and the round that is starting.
Empirica.onRoundStart((game, round) => {
    console.log("round", round.index, "started");
    game.players.forEach(player => {
      player.round.set("alterIds", player.get("alterIds"));
      player.round.set("guess", null);
      player.round.set("performance", player.get("performance"));
    });
  
    const feedbackTime =
      game.treatment.feedbackRate > 0 &&
      (round.index + 1) %
        Math.round(
          game.treatment.nRounds /
            (game.treatment.feedbackRate * game.treatment.nRounds)
        ) ===
        0;
    round.set("displayFeedback", feedbackTime);
    console.log("display feedback at round", round.index, "?", feedbackTime);
  });

// onRoundStart is triggered before each stage starts.
// It receives the same options as onRoundStart, and the stage that is starting.
Empirica.onStageStart((game, round, stage) => {
    console.log("stage", stage.name, "started");
  });
  
  // It receives the same options as onRoundEnd, and the stage that just ended.
  Empirica.onStageEnd((game, round, stage) => {
    console.log("stage", stage.name, "ended");
    if (stage.name === "response") {
      //to keep track of the initial guess easily for analysis
      game.players.forEach(player => {
        player.round.set("initialGuess", player.round.get("guess"));
      });
      computeScore(game.players, round);
    } else if (stage.name === "interactive") {
      //after the 'interactive' stage, we compute the score and color it
      computeScore(game.players, round);
      if (game.treatment.altersCount > 0 && round.get("displayFeedback")) {
        colorScores(game.players);
      }
    }
  });

// onRoundEnd is triggered after each round.
// It receives the same options as onGameEnd, and the round that just ended.
Empirica.onRoundEnd((game, round) => {
    console.log("round", round.index, "ended");
    game.players.forEach(player => {
      const currentScore = player.get("cumulativeScore");
      const roundScore = player.round.get("score");
      const cumScore = Math.round((currentScore + roundScore) * 100) / 100;
      player.set("cumulativeScore", cumScore);
    });
  
    //checking whether the game contains shock and whether it is time for it!
    //currentRoundNumber % nRounds/shockRate * nRounds => whether it is time!
    const shockTime =
      game.treatment.shockRate > 0 &&
      (round.index + 1) %
        Math.round(
          game.treatment.nRounds /
            (game.treatment.shockRate * game.treatment.nRounds)
        ) ===
        0;
    //if it is time for a shock to arrive, then shock the players
    // i.e., change the difficulty of the task for them.
    shockTime ? shock(game.players) : null;
    console.log("round:", round.index, ", is it shock time?", shockTime);
  });  


// onRoundEnd is triggered when the game ends.
// It receives the same options as onGameStart.
Empirica.onGameEnd(game => {
    console.log("The game", game._id, "has ended");
    const conversionRate = game.treatment.conversionRate || 1;
    game.players.forEach(player => {
      const bonus =
        Math.round(player.get("cumulativeScore") * conversionRate * 100) / 100;
      player.set("bonus", bonus);
    });
  });
  
// Helper function for game to compute game score
function computeScore(players, round, game) {
    const correctAnswer = round.get("task").correctAnswer;
  
    players.forEach(player => {
      const guess = player.round.get("guess");
  
      //From Mehdi's PNAS experiment ..
      let scoreIncrement = 0;
      if (guess) {
        let e = Math.abs(correctAnswer - guess);
        if (e > Math.PI) {
          e = Math.abs(e - 2 * Math.PI);
        }
        scoreIncrement = Math.round(Math.exp(-5 * e * e) * 10);
      } else {
        //if they gave no answer, deduct a point from them
        scoreIncrement = -10;
      }
  
      //score increment such that it includes the performance in all stages
      const score = (player.round.get("score") || 0) + scoreIncrement;
  
      player.stage.set("score", Math.round(score * 100) / 100);
      player.round.set("score", Math.round(score * 100) / 100);
    });
  }

// We sort the players based on their score in this round in order to color code
// how we display their scores.
// The highest 1/3 players are green, the lowest 1/3 are red, and the rest are orange.
function colorScores(players) {
    const sortedPlayers = players.sort(compareScores);
    const top3rd = Math.floor(players.length / 3);
    const bottom3rd = Math.floor(players.length - players.length / 3);
  
    sortedPlayers.forEach((player, i) => {
      if (i < top3rd) {
        player.round.set("scoreColor", "green");
      } else if (i >= bottom3rd) {
        player.round.set("scoreColor", "red");
      } else {
        player.round.set("scoreColor", "orange");
      }
    });
  }
  
  // Helper function to sort players objects based on their score in the current round.
  function compareScores(firstPlayer, secondPlayer) {
    const scoreA = firstPlayer.round.get("score");
    const scoreB = secondPlayer.round.get("score");
  
    let comparison = 0;
    if (scoreA > scoreB) {
      comparison = -1;
    } else if (scoreA < scoreB) {
      comparison = 1;
    }
    return comparison;
  }
  
  // Shocking the players by changing the difficulty of the problem that they see
  // -1 permutation: easy => hard; medium => easy; hard => medium.
  function shock(players) {
    console.log("time for shock [inside shock(players]");
    players.forEach(player => {
      const currentDifficulty = player.get("performance");
      if (currentDifficulty === "good") {
        player.set("difficulty", "bad");
      } else {
        player.set("difficulty", "good");
      }
    });
  }