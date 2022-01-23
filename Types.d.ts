export interface TVP_Account {
  proxy: string;
  controller: string;
  stash: string;
  value: number;
}

export interface Nominee {
  val_address: string;
  nomination_count: number;
  score:number;
}

export interface Nomination {

  nominator: string;
  nominees: Nominee[];
  era: number;

}


export interface PendingNomination {
  nominator: string;
  proxy_info: ProxyAssignments;
}

export interface ProxyAssignments {
  _id: string;
  number: number;
  controller: string;
  targets: string[];
  callHash: string;
  __v: number;
}

export interface TVP_Candidate {
  discoveredAt: any;
  nominatedAt: any;
  offlineSince: number;
  offlineAccumulated: number;
  rank: number;
  faults: number;
  invalidityReasons: string;
  unclaimedEras: number[];
  inclusion: number;
  name: string;
  stash: string;
  kusamaStash: string;
  commission: number;
  identity: Identity;
  active: boolean;
  valid: boolean;
  validity: Validity[];
  score: Score;
  total: number;
  location: string;
  councilStake: string;
  councilVotes: string[];
  democracyVoteCount: number;
  democracyVotes: number[];
}

export interface Identity {
  name: string;
  sub?: string | null;
  verified?: boolean | null;
  _id: string;
}

export interface ValidityEntity {
  valid: boolean;
  type: string;
  details: string;
  updated: number;
  _id: string;
}

export interface Score {
  _id: string;
  address: string;
  updated: number;
  total: number;
  aggregate: number;
  inclusion: number;
  spanInclusion: number;
  discovered: number;
  nominated: number;
  rank: number;
  unclaimed: number;
  bonded: number;
  faults: number;
  offline: number;
  randomness: number;
  __v: number;
}

export interface PreviousNominations {
  _id: string;
  validators?: (string | null)[] | null;
  address: string;
  era: number;
  timestamp: number;
  bonded: number;
  blockHash: string;
  __v: number;
}

export interface Current {
  name: string;
  stash: string;
  identity: Identity;
}

export interface Nominators {
  _id: string;
  address: string;
  stash: string;
  proxy: string;
  bonded: any;
  avgStake: number;
  proxyDelay: number;
  current: Current[];
  lastNomination: any;
  createdAt: any;
  __v: number;
  nominateAmount: number;
  newBondedAmount: number;
  rewardDestination: string;
}