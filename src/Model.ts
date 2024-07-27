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
		this.getData().push(obj)
		this.db.write()
	}

	async findAll(): Promise<Array<T> | null> {
		return this.getData()
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
}
