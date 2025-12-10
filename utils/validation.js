function validateInput(input) {
  return typeof input === "string" && input.trim().length > 0;
}

function validateMinPlayers(players, min = 2) {
  return Array.isArray(players) && players.length >= min;
}

module.exports = {
  validateInput,
  validateMinPlayers,
};
