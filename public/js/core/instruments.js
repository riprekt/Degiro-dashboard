export const instrumentsByIsin = {
  IE00B4L5Y983: {
    shortName: "IWDA",
    ticker: "IWDA.AS",
    name: "iShares Core MSCI World",
    currency: "EUR",
  },
  IE00BKM4GZ66: {
    shortName: "EMIM",
    ticker: "EMIM.AS",
    name: "iShares Core MSCI Emerging Markets IMI",
    currency: "EUR",
  },
  IE00BFY0GT14: {
    shortName: "SWRD",
    ticker: "SWRD.AS",
    name: "SPDR MSCI World",
    currency: "EUR",
  },
  IE00BK5BQT80: {
    shortName: "VWCE",
    ticker: "VWCE.DE",
    name: "Vanguard FTSE All-World",
    currency: "EUR",
  },
  US00165C1045: {
    shortName: "AMC",
    ticker: "AMC",
    name: "AMC Entertainment",
    currency: "USD",
  },
};

export function findInstrument(isin) {
  return instrumentsByIsin[isin] ?? null;
}
