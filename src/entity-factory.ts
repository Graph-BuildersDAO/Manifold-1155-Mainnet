import {
  log,
  Address,
  BigInt,
  DataSourceContext,
  DataSourceTemplate,
  ethereum,
  bigInt,
} from "@graphprotocol/graph-ts";
import {
  ERC1155CreatorImplementation as ERC1155,
  URI,
} from "../generated/ERC1155CreatorImplementation/ERC1155CreatorImplementation";
import { Account, Collection, Holding, Meta, NFT } from "../generated/schema";
import { createArweaveMeta } from "./meta";

//Creating the NFT
export function getOrCreateNFT(
  id: BigInt,
  address: Address,
  block: ethereum.Block
): NFT {
  // attempt to load the nft from the store
  let nft = NFT.load(address.toHexString() + "-" + id.toString());

  // if it doesn't exist, we need to create one
  if (!nft) {
    let _erc1155 = ERC1155.bind(address);

    //ETH Calls to build out the NFT
    let try_creator = _erc1155.try_owner();

    nft = new NFT(address.toHexString() + "-" + id.toString());
    nft.creator = try_creator.reverted
      ? Address.fromString("0x0000000000000000000000000000000000000000")
      : try_creator.value;

    nft.timestamp = block.timestamp;
    nft.totalSupply = BigInt.fromI32(0);
    nft.transferCount = 0;
    nft.uniqueHolders = 0;

    nft.save();

    // Get the URI (presumably an arweave uri)
    let try_uri = _erc1155.try_uri(id);

    // Attempt to instatiate the arweave file data source
    if (!try_uri.reverted) {
      if (try_uri.value.includes("https://arweave.net/")) {
        createArweaveMeta(
          try_uri.value.substr(20),
          address.toHexString(),
          id.toString()
        );
      }
      // If not arweave then store the returned URI value as the content
      else {
        let meta = new Meta(address.toHexString() + "-" + id.toString());
        meta.content = try_uri.value;
        meta.nft = nft.id;
      }
    }
  }

  return nft as NFT;
}

//Creating the acount
export function getOrCreateAccount(id: string): Account {
  let account = new Account(id);

  if (!account) {
    account = new Account(id);
    account.save();
  }

  return account as Account;
}

//Creating Holdings for Transfer event
export function getOrCreateHoldings(account: Account, nft: NFT): Holding {
  let holding = Holding.load(account.id + "-" + nft.id);

  if (!holding) {
    holding = new Holding(account.id + "-" + nft.id);
    holding.account = account.id;
    holding.nft = nft.id;
    holding.balance = BigInt.fromI32(0);

    holding.save();
  }

  return holding as Holding;
}

//Creating Collections for Transfer event
export function getOrCreateCollection(address: Address): Collection {
  let collection = Collection.load(address.toHexString());
  if (!collection) {
    collection = new Collection(address.toHexString());
    collection.nfts = collection.id;
    collection.transferCount = 0;
    collection.uniqueHolders = 0;

    collection.save();
  }
  return collection as Collection;
}
