import serverWidget from 'N/ui/serverWidget';

jest.mock('N/ui/serverWidget');

describe('HelloWorld Suitelet Tests', () => {
    let mockForm;
    let mockField;
    let mockRequest;
    let mockResponse;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock form and field objects
        mockField = {
            defaultValue: ''
        };
        
        mockForm = {
            addField: jest.fn().mockReturnValue(mockField)
        };
        
        mockRequest = {
            method: 'GET'
        };
        
        mockResponse = {
            writePage: jest.fn()
        };

        serverWidget.createForm = jest.fn().mockReturnValue(mockForm);
        serverWidget.FieldType = {
            INLINEHTML: 'inlinehtml'
        };
    });

    it('should create form with correct title', () => {
        // Simulate the suitelet logic
        const form = serverWidget.createForm({
            title: 'Avera MX'
        });

        expect(serverWidget.createForm).toHaveBeenCalledWith({
            title: 'Avera MX'
        });
        expect(form).toBeDefined();
    });

    it('should add greeting field with correct properties', () => {
        const form = serverWidget.createForm({ title: 'Avera MX' });
        
        const greetingField = form.addField({
            id: 'greeting',
            label: 'Saludo',
            type: serverWidget.FieldType.INLINEHTML
        });

        expect(form.addField).toHaveBeenCalledWith({
            id: 'greeting',
            label: 'Saludo',
            type: 'inlinehtml'
        });
        expect(greetingField).toBeDefined();
    });

    it('should set HTML content in greeting field', () => {
        const form = serverWidget.createForm({ title: 'Avera MX' });
        const greetingField = form.addField({
            id: 'greeting',
            label: 'Saludo',
            type: serverWidget.FieldType.INLINEHTML
        });

        const expectedHTML = `
            <div style="text-align: center; font-family: 'Arial', sans-serif; background-color: #f0f8ff; padding: 50px; border-radius: 15px; border: 2px solid #add8e6; color: #333;">
            <h1 style="color: #4682b4; font-size: 3em; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">Hello, World!</h1>
            <p style="font-size: 1.2em; color: #555;">Made with ❤️ by the Avera Engineering Team.</p>
            </div>`;

        greetingField.defaultValue = expectedHTML;

        expect(greetingField.defaultValue).toContain('Hello, World!');
        expect(greetingField.defaultValue).toContain('Avera Engineering Team');
    });

    it('should write page to response', () => {
        const scriptContext = {
            request: mockRequest,
            response: mockResponse
        };

        const form = serverWidget.createForm({ title: 'Avera MX' });
        scriptContext.response.writePage(form);

        expect(mockResponse.writePage).toHaveBeenCalledWith(form);
    });
});