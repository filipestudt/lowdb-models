import { toObject, objectAsArray, ObjectKeyValue } from '../lib'

export type AttributeInfo = {
	required?: Boolean
	unique?: Boolean
}

// The model creator set the attribute's name as an own property
// to make it easier to loop into
export type Attribute = AttributeInfo & {
	name: any
}

// Model's attributes, each attribute it's an AttributeInfo type
// this way when the user is creating a new model it will show the AttributeInfo options
export type Attributes = {
	[k: string]: AttributeInfo
}

// To not have to depend on the lowdb package
export type Low = {
	data: any
	read: Function
	write: Function
}

export class Model<T> {
	tableName: String
	db: Low
	attributes: Array<Attribute>
	data: Array<T>

	constructor(database: Low, tableName: String, attributes: Array<Attribute>) {
		this.db = database
		this.tableName = tableName
		this.attributes = attributes
	}

	async create(obj: T): Promise<void> {
		this.checkDuplicated(obj)
		this.getData().push(obj)
		this.db.write()
	}

	async findAll(): Promise<Array<T> | null> {
		return this.getData()
	}		

	async findOne(query: any): Promise<T | null> {
		return this.getData().find(entry => {
			let entryArr = objectAsArray(entry)
			let queryArr = objectAsArray(query)
			return this.runQuery(queryArr, entryArr)
		})
	}

	async find(query: any): Promise<Array<T>> {
		return this.getData().filter(entry => {
			let entryArr = objectAsArray(entry)
			let queryArr = objectAsArray(query)
			return this.runQuery(queryArr, entryArr)
		})
	}

	private runQuery(queries: Array<ObjectKeyValue>, entries: Array<ObjectKeyValue>): Boolean {		
		// Filter wich queries are met
		let queriesMet = queries.filter(query => {
			// Loop the entry to query
			// If the result length is one, then the query were met
			let matched = entries.filter(entry => 
				query.name === entry.name 
					&& query.value === entry.value)
				
			return matched.length === 1
		})
		// If all queries were met the length will be the same
		return queriesMet.length === queries.length
	}

	// Get the data of the attribute with the name of the model tableName
	private getData(): Array<any> {
		let attr: any = this.tableName

		if (!this.db.data) {
			this.db.data[attr] = []
			this.db.write()
		}

		return this.db.data[attr]
	}

	private async checkDuplicated(obj: T): Promise<void> {
		for (let attr of this.attributes)
			if (attr.unique
				&& attr.unique === true
				&& await this.findOne(toObject(attr.name, obj[attr.name])))
				throw new Error('Duplicated')
	}
}
