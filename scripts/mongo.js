db.getCollection("properties").find({status: 'PENDING'}).count();
db.getCollection("properties").find({status: 'DONE'}).count();
// db.properties.find().count();
//db.properties.aggregate([
//  {$group: {_id: "$url", n: {$sum:1} }}
//  ,{$sort: {n: -1}}
//  ,{$limit: 10}
//]);
//db.properties.find({address: {"$ne":null}});
db.properties.find({address: {"$ne":null}}).count();
db.properties.find({url: '/properties/1422590/virginia-shopping-center-for-sale'});
