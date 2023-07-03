import { Container } from '../../registry.mjs';
export class GetConfigEndpoint {
    name = 'active-object-config-get';
    isRoot = false;
    async handle() {
        const { $store, $utils } = new Container();
        const filePath = 'active-object-config.json';
        if ((await $store.exists({ filePath }))) {
            let content = await $store.read({ filePath });
            content = $utils.getJSONObject(content);
            return {
                contentType: 'application/json',
                statusCode: 200,
                statusMessage: '200 Success',
                responseContent: $utils.getJSONString(content)
            };
        } else {
            return {
                contentType: 'application/json',
                statusCode: 404,
                statusMessage: '404 Not Found',
                responseContent: $utils.getJSONString({ message: '404 Not Found' })
            };
        }
    }
}
