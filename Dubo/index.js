Dubo = addPlayers => {
  const strIsNumber = v =>
    /^(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)|(\d))$/.test(
      v + ""
    );
  let players = addPlayers
    ? addPlayers.map(v => ({
        name: v,
        log: [],
        price: 0
      }))
    : [];
  const getPlayers = msg => {
    msg &&
      console.log(
        players.length
          ? "现在有" + players.length + "个玩家"
          : "一个人都没啊，老哥，叫人啊"
      );
    return players.reduce((a, b) => ({ ...a, [b.name]: b }), {});
  };
  let roundCount = 0;
  const bsi18n = v => (v ? "大" : "小");
  console.log(
    "%c--欢迎来到皇家澳门赌场，弟弟们--",
    "color:red;font-size:16px;"
  );
  /* 庄家， */
  return {
    newRound: (banker, roundPlayers = [], price) => {
      roundPlayers =
        typeof roundPlayers[0] !== "string" ? roundPlayers : [roundPlayers];
      const bigSmall = Math.random() > 0.5;
      const bkplayer = getPlayers()[banker];
      let bkPrice = 0;
      let bkmsg;
      if (!players.find(v => v.name === banker)) {
        console.log("庄家不存在。老弟");
        return;
      }
      if (
        !roundPlayers.length ||
        !roundPlayers.every(v1 => !!players.find(v2 => v1[0] === v2.name))
      ) {
        console.log("玩家不存在。老弟");
        return;
      }
      if (
        !roundPlayers.every(
          v1 => players.find(v2 => v1[0] === v2.name).price > 0
        )
      ) {
        console.log("玩家余额不足😊,请充值");
        return;
      }
      if (!strIsNumber(price)) {
        console.log("下的注能给个数字吗，老弟？？");
        return;
      }
      if (!roundPlayers.every(v => strIsNumber(v[3]) || v[3] === undefined)) {
        console.log("下的注能给个数字吗，老弟？？");
        return;
      }
      roundCount++;
      const msgs = [];
      console.log(...[`%c----开盘咯----`, "color:blue;font-size:18px;"]);
      console.log(...[`%c普通下注${price}元`, `color:blue;font-size:16px;`]);
      console.log(
        ...[
          `%c这一轮是${bsi18n(bigSmall)}😄😄😄！！！`,
          `color:red;font-size:16px;`
        ]
      );

      roundPlayers.forEach(v => {
        const name = v[0];
        const guess = v[1];
        const xiaPrice = v[2] || price;
        const player = getPlayers()[name];
        let msg;
        if (bigSmall === guess) {
          bkPrice -= xiaPrice;
          player.price += xiaPrice;
          msg = `你猜${bsi18n(guess)},${
            v[2] ? `自定义下注${v[2]}元,` : ""
          }赚了${xiaPrice}元.`;
          msgs.push(`${name}: ${msg}`);
          player.log.push(`第${roundCount}轮是${bsi18n(bigSmall)},` + msg);
        } else {
          bkPrice += xiaPrice;
          player.price -= xiaPrice;
          msg = `你猜${bsi18n(guess)},${
            v[2] ? `自定义下注${v[2]}元,` : ""
          }亏了${xiaPrice}元.`;

          msgs.push(`${name}: ${msg}`);
          player.log.push(`第${roundCount}轮是${bsi18n(bigSmall)},` + msg);
        }
      });
      bkplayer.price += bkPrice;
      bkmsg = `你做庄${bkPrice > 0 ? "赚了" : "亏了"}${bkPrice}元.`;
      bkplayer.log.push(`第${roundCount}轮是${bsi18n(bigSmall)},` + bkmsg);

      msgs.push(`${bkplayer.name}: ${bkmsg}`);
      console.log("%c" + msgs.join("\n"), "font-size:16px;");
    },
    roundMsg: number => number,
    getRound: number => `当前第${roundCount}轮`,
    addPlayer: a => {
      if (Array.isArray(a)) {
        players = players.concat(
          a.map(v => ({
            name: v,
            log: [],
            price: 0
          }))
        );
      } else {
        players = players.concat(
          [a].map(v => ({
            name: v,
            log: [],
            price: 0
          }))
        );
      }
      return getPlayers(true);
    },
    getPlayers: () => getPlayers(true),
    getPlayerMsg: name => {
      name && console.log(getPlayers()[name].log.join("\n"));
      name && console.log(`当前余额: ${getPlayers()[name].price}元`);
    }
  };
};
