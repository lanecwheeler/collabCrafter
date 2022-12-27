// import config from '../data/testingFlatFile.json' assert { type: 'json' }

import { MongoClient } from 'mongodb'
const url = process.env.MONGODB_URL
const client = new MongoClient(url);
const db = client.db('collabCrafter');

export default class UserConfigs {
    constructor(guildId) {
        this.guildId = guildId
    }

    connect = (collection) => {
        const dbo = db.collection(collection)
        client.connect()
        return dbo
    }

    getMemberData = async (userId) => {
        const dbo = this.connect('userConfigs')
        const query = {
            'gid' : this.guildId,
            'uid' : userId,
        }

        return dbo.findOne(query);
    }

    updateUser = async (userId, options) => {
        const dbo = this.connect('userConfigs')
        const query = {
            'gid' : this.guildId,
            'uid' : userId,
        }
        
        return dbo.findOneAndUpdate(query, options, { returnDocument: 'before', upsert: true })
    }
}
