import { Model, Attributes, Low } from './src/Model'

export function newModel(attributes: Attributes, info: {tableName: string}): Model<any> {	
	let attributesArr: Array<any> = []
	for (let key in attributes) {
		attributesArr.push({name: key,...attributes[key]})
	}
	return new Model(info.tableName, attributesArr)
}
