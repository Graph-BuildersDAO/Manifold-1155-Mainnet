import {
  BigInt,
  Bytes,
  DataSourceContext,
  DataSourceTemplate,
  dataSource,
} from "@graphprotocol/graph-ts";
import {
  ERC1155CreatorImplementation as ERC1155,
  RoyaltiesUpdated,
  TransferBatch,
  TransferSingle,
  URI,
} from "../generated/ERC1155CreatorImplementation/ERC1155CreatorImplementation";
import { Account, Holding, Meta, NFT } from "../generated/schema";
import {
  getOrCreateAccount,
  getOrCreateCollection,
  getOrCreateHoldings,
  getOrCreateNFT,
} from "./entity-factory";
import { log } from "matchstick-as";
import { createArweaveMeta } from "./meta";

export function handleTransferBatch(event: TransferBatch): void {
  let ids = event.params.ids;

  for (let index = 0; index < ids.length; index++) {
    let nft = getOrCreateNFT(
      event.params.ids[index],
      event.address,
      event.block
    );
    let sender = getOrCreateAccount(event.params.from.toHexString());
    let receiver = getOrCreateAccount(event.params.to.toHexString());
    let senderHolding = getOrCreateHoldings(sender, nft);
    let receiverHolding = getOrCreateHoldings(receiver, nft);

    // NFT Supply changes on mints
    if (
      event.params.from.toHexString() ==
      "0x0000000000000000000000000000000000000000"
    )
      nft.totalSupply = nft.totalSupply.plus(event.params.values[index]);

    // NFT Supply changes on burns
    if (
      event.params.to.toHexString() ==
      "0x0000000000000000000000000000000000000000"
    )
      nft.totalSupply = nft.totalSupply.minus(event.params.values[index]);

    // Unique holders updates regarding transfers to and from 1155 owners
    // on a batch transfers
    if (
      receiverHolding.balance == BigInt.fromI32(0) &&
      event.params.values[index].gt(BigInt.fromI32(0))
    ) {
      nft.uniqueHolders = nft.uniqueHolders + 1;
    }
    if (
      senderHolding.balance == event.params.values[index] &&
      event.params.values[index].gt(BigInt.fromI32(0))
    )
      nft.uniqueHolders = nft.uniqueHolders - 1;

    // Batch holdings updates on holders balance
    senderHolding.balance = senderHolding.balance.minus(
      event.params.values[index]
    );
    receiverHolding.balance = receiverHolding.balance.plus(
      event.params.values[index]
    );

    nft.uniqueHolders = nft.uniqueHolders + 1;

    nft.save();
  }
}

export function handleTransferSingle(event: TransferSingle): void {
  // Getters
  let collection = getOrCreateCollection(event.address);
  let nft = getOrCreateNFT(event.params.id, event.address, event.block);
  let sender = getOrCreateAccount(event.params.from.toHexString());
  let receiver = getOrCreateAccount(event.params.to.toHexString());
  let senderHolding = getOrCreateHoldings(sender, nft);
  let receiverHolding = getOrCreateHoldings(receiver, nft);

  // NFT Supply changes on mints
  if (
    event.params.from.toHexString() ==
    "0x0000000000000000000000000000000000000000"
  ) {
    nft.totalSupply = nft.totalSupply.plus(event.params.value);
  }

  // NFT Supply changes on burns
  if (
    event.params.to.toHexString() ==
    "0x0000000000000000000000000000000000000000"
  ) {
    nft.totalSupply = nft.totalSupply.minus(event.params.value);
  }

  // Unique holders updates regarding transfers to and from 1155 owners
  // on a single transfer
  if (
    receiverHolding.balance == BigInt.fromI32(0) &&
    event.params.value.gt(BigInt.fromI32(0))
  ) {
    nft.uniqueHolders = nft.uniqueHolders + 1;
  }
  if (
    senderHolding.balance == event.params.value &&
    event.params.value.gt(BigInt.fromI32(0))
  )
    nft.uniqueHolders = nft.uniqueHolders - 1;

  // Single holdings updates on holders balance
  senderHolding.balance = senderHolding.balance.minus(event.params.value);
  receiverHolding.balance = receiverHolding.balance.plus(event.params.value);

  // Collection Supply updated
  collection.transferCount = collection.transferCount + 1;
  nft.transferCount = nft.transferCount + 1;

  // Entity saves
  nft.save();
  sender.save();
  receiver.save();

  // save sender holdings if it isn't 0x0
  if (
    event.params.from.toHexString() !=
    "0x0000000000000000000000000000000000000000"
  )
    senderHolding.save();

  // save receiver holdings if it isn't 0x0
  if (
    event.params.to.toHexString() !=
    "0x0000000000000000000000000000000000000000"
  )
    receiverHolding.save();
}

export function handleURI(event: URI): void {
  createArweaveMeta(
    event.params.value.substr(20),
    event.address.toHexString(),
    event.params.id.toString()
  );
}
