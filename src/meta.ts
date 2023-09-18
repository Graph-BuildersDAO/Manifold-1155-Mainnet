import {
  Bytes,
  DataSourceContext,
  DataSourceTemplate,
  dataSource,
  log,
  ipfs,
  json,
  JSONValueKind,
} from "@graphprotocol/graph-ts";
import { Meta } from "../generated/schema";

export function createArweaveMeta(
  uri: string,
  address: string,
  id: string
): void {
  //Creating a new key:value for the metadata entity
  let context = new DataSourceContext();

  // Set the key:value that we want to pass into the metadata entity
  context.setString("NFTID", address + "-" + id);

  // instantiates the arweave template
  // the params string in createWithContext() should house the uri
  // the context should be the key:value store that we want to pass into the metadata entity
  DataSourceTemplate.createWithContext("ArweaveMetadata", [uri], context);
}

//Creating the NFT metadata function
export function handleNFTMetadata(content: Bytes): void {
  //creating the variable 'ctx' as context
  let ctx = dataSource.context();
  let id = ctx.getString("NFTID");
  let metadata = new Meta(id);

  let value = json.fromBytes(content).toObject();
  let name = value.get("name");
  let createdBy = value.get("created_by");
  let description = value.get("description");
  let image = value.get("image");
  let attributes = value.get("attributes");

  if (value) {
    //Getting the array of attributes
    if (attributes) {
      let attributeArray = attributes.toArray();
      let arrayLength = attributeArray.length;

      for (let i = 0; i < arrayLength; i++) {
        let attributeObject = attributeArray[i].toObject();
        let traitTypeJSON = attributeObject.get("trait_type");
        let traitValueJSON = attributeObject.get("value");
        if (traitTypeJSON && traitValueJSON) {
          let traitType = traitTypeJSON.toString();
          let traitValue = traitValueJSON.toString();

          //Getting the specific array of attributes and their values
          if (traitType && traitValue) {
            if (traitType == "Artist") metadata.artist = traitValue;
            if (traitType == "Year") metadata.year = traitValue;
            if (traitType == "Collection") metadata.collection = traitValue;
            if (traitType == "Medium") metadata.medium = traitValue;
          }
        }

        // Parsing the JSON response, get the various attribute fields
      }
      if (name) metadata.name = name.toString();
      if (image) metadata.image = image.toString();
      if (description) metadata.description = description.toString();
      if (createdBy) metadata.createdBy = createdBy.toString();
    }
    metadata.content = content.toString();
    metadata.nft = id;
    metadata.save();
  }
}
