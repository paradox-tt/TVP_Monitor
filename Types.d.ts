export interface TVP_Account {
	proxy: string;
	controller: string;
	stash: string;
	value: number;
}

export interface Nominee {
	val_address: string;
	nomination_count: number;
	score: number;
	streak: number;
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
	discoveredAt: number;
	nominatedAt: number;
	offlineSince: number;
	offlineAccumulated: number;
	rank: number;
	faults: number;
	invalidityReasons: string;
	unclaimedEras: any[];
	inclusion: number;
	name: string;
	stash: string;
	kusamaStash: string;
	commission: number;
	identity: Identity;
	active: boolean;
	validity: Validity[];
	score: Score;
	total: number;
	location: string;
	councilStake: string;
	councilVotes: string[];
	democracyVoteCount: number;
	democracyVotes: number[];
	matrix: string[];
}

export interface Identity {
	name: string;
	sub?: string | null;
	verified?: boolean | null;
	_id: string;
}

export interface Validity {
	valid: boolean;
	type: string;
	details: string;
	updated: number;
	_id: string;
}

export interface Score {
	_id: string;
	updated: number;
	address: string;
	total: number;
	aggregate: number;
	spanInclusion: number;
	inclusion: number;
	discovered: number;
	nominated: number;
	rank: number;
	unclaimed: number;
	bonded: number;
	faults: number;
	offline: number;
	location: number;
	councilStake: number;
	democracy: number;
	randomness: number;
	__v: number;
	asn: number;
	country: number;
	nominatorStake: number;
	provider: number;
	region: number;
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
	current: Current[];
	lastNomination: any;
	createdAt: any;
	address: string;
	__v: number;
	bonded: any;
	proxy: string;
	stash: string;
	proxyDelay: number;
	avgStake: number;
	nominateAmount: number;
	newBondedAmount: number;
	rewardDestination: string;
}

export interface ValidatorList {

	targets: string[];
	submittedIn: number;
	suppressed: boolean;

}

export interface BlockInfo {
	block_hash: string,
	era: number,
	session: number
}
