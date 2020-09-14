[
  {
    timeFr: {
      $lte: moment(timeFr).utcOffset(utcOffset).startOf('day').toDate()
    }
  },
  {
    timeTo: {
      $gte: moment(timeTo).utcOffset(utcOffset).endOf('day').toDate()
    }
  }
];
