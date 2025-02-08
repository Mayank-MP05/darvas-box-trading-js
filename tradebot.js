const fs = require("fs");
const csv = require("csv-parser");
const moment = require("moment");

const investmentPerTrade = 5000;
// const targetMultiplier = 1.01;
const targetMultiplier = 1.06;
const upperMultiplier = 1.0275;
const lowerMultiplier = 0.9725;

let activeBuys = [];
let dataByWeek = {};

let buyAggrOrder = {
  totalQuantity: 0,
  totalInvestment: 0,
  avgBuyingPrice: 0,
  target: 0,
  upper: 0,
  lower: 0,
};

function getWeekStart(date) {
  return moment(date, "DD-MMM-YYYY").startOf("isoWeek").format("DD-MMM-YYYY");
}
let buyPrice;

function processWeek(week, weekStart, weekIdx) {
  console.log(`\nProcessing Week Starting: ${weekStart}`);
  // console.log("week-> ", week);
  let weekHigh = Math.max(
    ...week.map((day) => parseFloat(day["HIGH"]?.replace(/,/g, "")))
  );

    if (weekIdx == 0) {
        buyPrice = weekHigh;
        return;
}
  // console.log("weekHigh: ", weekHigh);

  let weeksLen = week.length;
  for (let i = 0; i < weeksLen; i++) {
    let row = week[i];

    const date = row["Date"];
    const currDayHigh = parseFloat(row["HIGH"]?.replace(/,/g, ""));
    const currDayLow = parseFloat(row["LOW"]?.replace(/,/g, ""));
    console.log(`Processing date: ${date}`);
    // console.log(`DayData: `, row);
    console.log(`OHLC: `, {
      date,
      currDayHigh,
      currDayLow,
    });

    // Determine buy price

    // FIXME: add the more than one order logic later on
    if (activeBuys.length === 0) {
      buyPrice = weekHigh;
      console.log(`[IF] Prev week high case`);
    } else {
      let lastActiveBuyUpper = buyAggrOrder.upper;
      let lastActiveBuyLower = buyAggrOrder.lower;

      console.log(`[ELSE] Prev buy order exists`);
      console.log({
        lastActiveBuyLower,
        lastActiveBuyUpper,
      });

      if (currDayLow <= lastActiveBuyLower) {
        console.log(`[RULE] lower of low hit case`);
        buyPrice = lastActiveBuyLower;
      }

      if (currDayHigh >= lastActiveBuyUpper) {
        console.log(`[RULE] higher of high hit case`);
        buyPrice = lastActiveBuyUpper;
      }

      if (!buyPrice) {
        buyPrice = Number.POSITIVE_INFINITY;
        console.log(`[RULE] No buy at this day`);
      }
    }
    console.log("buyPrice: ", buyPrice);

    if (currDayHigh >= buyPrice && buyAggrOrder.totalQuantity) {
      let quantity = Math.floor(investmentPerTrade / buyPrice);
      let totalInvestment = quantity * buyPrice;
      let avgBuyingPrice =
        (activeBuys.reduce((sum, b) => sum + b.price * b.quantity, 0) +
          totalInvestment) /
        (activeBuys.reduce((sum, b) => sum + b.quantity, 0) + quantity);
      let target = avgBuyingPrice * targetMultiplier;
      let upper = avgBuyingPrice * upperMultiplier;
      let lower = avgBuyingPrice * lowerMultiplier;

      activeBuys.push({ price: buyPrice, quantity, target, upper, lower });

      let prevQuantity = buyAggrOrder.totalQuantity;
      let prevInvestment = buyAggrOrder.totalInvestment;
      let totalAvgBuyingPrice =
        (totalInvestment + prevInvestment) / (prevQuantity + quantity);

      buyAggrOrder = {
        totalQuantity: prevQuantity + quantity,
        totalInvestment: prevInvestment + totalInvestment,
        avgBuyingPrice: totalAvgBuyingPrice,
        target: totalAvgBuyingPrice * targetMultiplier,
        upper: totalAvgBuyingPrice * upperMultiplier,
        lower: totalAvgBuyingPrice * lowerMultiplier,
      };

      console.log(`----------------- BUY ORDER START ----------------`);
      console.log(`BUY: ${quantity} shares at ${buyPrice} on ${date}.`);
      console.log(`Target: ${target}, Upper: ${upper}, Lower: ${lower}`);
      console.log(`Aggregate Holding Details: `, buyAggrOrder);
      console.log(`----------------- BUY ORDER END ----------------`);
    }

    // Check sell condition
    let totalProfit = 0;

    const totalHoldingTarget = buyAggrOrder.target;
    const totalHoldingBuyPrice = buyAggrOrder.avgBuyingPrice;
    const totalHoldingQuantity = buyAggrOrder.totalQuantity;
    console.log(
      "totalHoldingTarget - ",
      totalHoldingTarget,
      "currDayHigh  -",
      currDayHigh
    );
      if (totalHoldingTarget && currDayHigh >= totalHoldingTarget) {
      let sellPrice = totalHoldingTarget;
      let profit = (sellPrice - totalHoldingBuyPrice) * totalHoldingQuantity;
      totalProfit += profit;
      console.log(`----------------- SELL ORDER START ----------------`);
      console.log("buyAggrOrder - ", buyAggrOrder);
      console.log(
        `SELL: ${totalHoldingQuantity} shares at ${sellPrice} on ${date}. Profit: ${profit.toFixed(
          2
        )}`
      );
      console.log(
        `Sell Price: ${sellPrice}, Profit: ${profit}, Total Profit: ${totalProfit}`
      );
      console.log(`----------------- SELL ORDER END ----------------`);

      buyAggrOrder = {
        totalQuantity: 0,
        totalInvestment: 0,
        avgBuyingPrice: 0,
        target: Number.POSITIVE_INFINITY,
        upper: 0,
        lower: 0,
      };
    }
  }
  previousWeekHigh = weekHigh;
}

let machineSlowLimit = 0;
fs.createReadStream("data/hdfc-bank-raw.csv")
  .pipe(csv())
  .on("data", (row) => {
    row["HIGH"] = row["HIGH "];
    row["LOW"] = row["LOW "];
    row["PREV. CLOSE"] = row["PREV. CLOSE "];
    row["OPEN"] = row["OPEN "];
    row["Date"] = row["Date "];

    machineSlowLimit++;
    if (machineSlowLimit >= 260) {
      return;
    }

    const weekStart = getWeekStart(row["Date "]);

    if (!dataByWeek[weekStart]) {
      dataByWeek[weekStart] = [];
    }
    dataByWeek[weekStart].push(row);
    // console.log("dataByWeek-", dataByWeek);
  })
  .on("end", () => {
    let tradingWeeksLen = 0;
      Object.keys(dataByWeek).forEach((weekStart, weekIdx) => {
        processWeek(dataByWeek[weekStart], weekStart, weekIdx);
      console.log("weekStart - ", weekStart);
      // console.log("traduing days in week- ", dataByWeek[weekStart]?.length)
      tradingWeeksLen++;
    });
    console.log(
      "CSV processing completed. - tradingWeeksLen= ",
      tradingWeeksLen
    );
  });
