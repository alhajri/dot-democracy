import Empirica from "meteor/empirica:core";
import { taskData } from "./constants";
import "./callbacks.js";
import "./bots.js";

//this only works if we have 12 participants
const initial_network = {
    0: [2, 4, 9],
    1: [4, 8, 2],
    2: [4, 10, 3],
    3: [6, 10, 0],
    4: [0, 6, 8],
    5: [6, 9, 11],
    6: [5, 11, 10],
    7: [1, 5, 0],
    8: [3, 1, 7],
    9: [7, 2, 5],
    10: [1, 3, 11],
    11: [9, 7, 8]
  };

  const centralized_network = {
    0: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    1: [0],
    7: [0],
    2: [0],
    3: [0],
    4: [0],
    5: [0],
    6: [0],
    8: [0],
    9: [0],
    10:[0],
    11: [0]
  };
  
  function getAlters(player, playerIndex, playerIds, alterCount) {
    //using the initial network structure to create the network, otherwise, a random network
  
    let alterIds = [];
    if (playerIds.length === 12) {
      if (game.treatment.centralized){
        alterIds = playerIds.filter(
          (elt, i) => centralized_network[playerIndex].indexOf(i) > -1
        );
      } else {
        alterIds = playerIds.filter(
          (elt, i) => initial_network[playerIndex].indexOf(i) > -1
        );
      }
    } else {
      alterIds = _.sample(_.without(playerIds, player._id), alterCount);
    }
  
    return alterIds;
  }
  
  function getAvatar(player, i, type) {
    if (type === "animals") {
      return i > 16 ? `/avatars/jdenticon/${player._id}` : `/avatars/${i}.png`;
    } else {
      return `/avatars/jdenticon/${player._id}`;
    }
  }
  
  function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  
  function getDifficulty(player, i, difficultyTypes) {
    let difficulty = null;
    if (difficultyTypes === "equal_mix") {
      //equal number of difficulties .. this can be changed to change the fraction of easy/medium/hard
      difficulty = difficulties[(i + 1) % difficulties.length];
      console.log(
        "my difficulty is ",
        difficulties[(i + 1) % difficulties.length]
      );
    } else {
      //if not equal distribution of difficulties, then we either use what is passed or random if nothing is passed
      difficulty = difficulties.includes(difficultyTypes)
        ? difficultyTypes
        : randomChoice(difficulties);
    }
  
    return difficulty;
  }

  Empirica.gameInit((game, treatment, players) => {
    //for the players names (we will call them A, B, C etc)
    const alphabet = "abcdefghijklmnopqrstuvwxyz".toUpperCase().split("");
    // similar to the color of the avatar .. to do more go to https://jdenticon.com/#icon-D3
    const arrowColors = ["#A5CC66", "#B975D1", "#DC8A92"];
  
    //shuffle the stimuli
    const taskSequence = _.shuffle(taskData);
  
    //generate the difficulty levels (i.e., how many good and how many bad performers
    let performance = Array(players.length).fill(game.treatment.badDifficulty);
    performance = performance.fill(
      game.treatment.goodDifficulty,
      0,
      Math.ceil(game.treatment.nGoodPerformers * players.length)
    );
    performance = _.shuffle(performance);
    console.log("treatment: ", game.treatment, " will start with ", performance);
   //prepare players by creating the network
    const playerIds = _.pluck(game.players, "_id");
    players.forEach((player, i) => {
      player.set("avatar", getAvatar(player, i, "abstract"));
      player.set("arrowColor", arrowColors[i]);
      player.set("cumulativeScore", 0);
      player.set("bonus", 0);
      player.set("name", alphabet[i]);
      player.set("performance", performance[i]);

      const alterIds = getAlters(
        player,
        i,
        playerIds,
        game.treatment.altersCount
      );
      player.set("alterIds", alterIds);
    });
  
  
    _.times(game.treatment.nRounds, i => {
      const round = game.addRound();
      round.set("task", taskSequence[i]);
  
      //first the initial response
      round.addStage({
        name: "response",
        displayName: "Response",
        durationInSeconds: game.treatment.stageDuration
      });

      //only add the interactive stage if it is NOT the solo condition
      if (game.treatment.altersCount > 0) {
        round.addStage({
          name: "interactive",
          displayName: "Interactive Response",
          durationInSeconds: game.treatment.stageDuration
        });
      }
  
      // adding "outcome" might look complicated but basically what we are checking is this:
      // when interactive with others, show the round outcome if there is feedback or rewiring
      // when no interactions with others only show the outcome stage when feedback is given
      if (
        (game.treatment.altersCount > 0 &&
          (game.treatment.feedbackRate > 0 || game.treatment.rewiring)) ||
        (game.treatment.altersCount === 0 && game.treatment.feedbackRate > 0)
      ) {
        round.addStage({
          name: "outcome",
          displayName: "Round Outcome",
          durationInSeconds: game.treatment.stageDuration
        });
      }
    });
  });