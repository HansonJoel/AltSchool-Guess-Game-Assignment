class Player {
  constructor(id, name, isMaster = false) {
    this.id = id;
    this.name = name;
    this.score = 0;
    this.attempts = 3;
    this.isMaster = isMaster;
  }
}

module.exports = Player;
