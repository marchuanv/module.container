import {
    Container
} from '../../../lib/registry.mjs';
describe('when-activating-create-config-endpoint', () => {
    let $createConfigEndpoint;
    beforeAll(() => {
        const container = new Container();
        ({ $createConfigEndpoint } = container);
    });
    it('should get an instance', () => {
        expect($createConfigEndpoint).toBeDefined();
    });
    it('should verify class members', () => {
        expect($createConfigEndpoint.name).toBe('active-object-config-create');
    });
});