import log from 'N/log';
import record from 'N/record';

jest.mock('N/log');
jest.mock('N/record');

describe('User Event Script Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('beforeLoad Event', () => {
        it('should add custom button to customer form in edit mode', () => {
            const mockButton = {};
            const mockForm = {
                addButton: jest.fn().mockReturnValue(mockButton)
            };

            const scriptContext = {
                type: 'edit',
                form: mockForm,
                newRecord: {
                    type: 'customer',
                    id: '123'
                }
            };

            // Simulate beforeLoad function
            const beforeLoad = (context) => {
                if (context.type === 'edit' && context.newRecord.type === 'customer') {
                    context.form.addButton({
                        id: 'custpage_validate_data',
                        label: 'Validate Customer Data',
                        functionName: 'validateCustomerData'
                    });

                    log.debug({
                        title: 'Custom Button Added',
                        details: `Added validation button to customer ${context.newRecord.id}`
                    });
                }
            };

            beforeLoad(scriptContext);

            expect(mockForm.addButton).toHaveBeenCalledWith({
                id: 'custpage_validate_data',
                label: 'Validate Customer Data',
                functionName: 'validateCustomerData'
            });

            expect(log.debug).toHaveBeenCalledWith({
                title: 'Custom Button Added',
                details: 'Added validation button to customer 123'
            });
        });

        it('should not add button in view mode', () => {
            const mockForm = {
                addButton: jest.fn()
            };

            const scriptContext = {
                type: 'view',
                form: mockForm,
                newRecord: {
                    type: 'customer',
                    id: '123'
                }
            };

            const beforeLoad = (context) => {
                if (context.type === 'edit' && context.newRecord.type === 'customer') {
                    context.form.addButton({
                        id: 'custpage_validate_data',
                        label: 'Validate Customer Data',
                        functionName: 'validateCustomerData'
                    });
                }
            };

            beforeLoad(scriptContext);

            expect(mockForm.addButton).not.toHaveBeenCalled();
        });
    });

    describe('beforeSubmit Event', () => {
        it('should validate customer email before saving', () => {
            const mockRecord = {
                getValue: jest.fn().mockReturnValue('invalid-email'),
                setValue: jest.fn()
            };

            const scriptContext = {
                type: 'create',
                newRecord: mockRecord
            };

            const beforeSubmit = (context) => {
                if (context.type === 'create' || context.type === 'edit') {
                    const email = context.newRecord.getValue('email');
                    
                    if (email && !isValidEmail(email)) {
                        log.error({
                            title: 'Invalid Email',
                            details: `Invalid email format: ${email}`
                        });
                        
                        throw new Error(`Invalid email format: ${email}`);
                    }

                    if (email) {
                        // Normalize email to lowercase
                        context.newRecord.setValue({
                            fieldId: 'email',
                            value: email.toLowerCase()
                        });
                    }
                }
            };

            const isValidEmail = (email) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            };

            expect(() => {
                beforeSubmit(scriptContext);
            }).toThrow('Invalid email format: invalid-email');

            expect(log.error).toHaveBeenCalledWith({
                title: 'Invalid Email',
                details: 'Invalid email format: invalid-email'
            });
        });

        it('should normalize valid email to lowercase', () => {
            const mockRecord = {
                getValue: jest.fn().mockReturnValue('TEST@EXAMPLE.COM'),
                setValue: jest.fn()
            };

            const scriptContext = {
                type: 'create',
                newRecord: mockRecord
            };

            const beforeSubmit = (context) => {
                if (context.type === 'create' || context.type === 'edit') {
                    const email = context.newRecord.getValue('email');
                    
                    if (email && !isValidEmail(email)) {
                        throw new Error(`Invalid email format: ${email}`);
                    }

                    if (email) {
                        context.newRecord.setValue({
                            fieldId: 'email',
                            value: email.toLowerCase()
                        });
                    }
                }
            };

            const isValidEmail = (email) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            };

            beforeSubmit(scriptContext);

            expect(mockRecord.setValue).toHaveBeenCalledWith({
                fieldId: 'email',
                value: 'test@example.com'
            });
        });
    });

    describe('afterSubmit Event', () => {
        it('should log successful customer creation', () => {
            const mockRecord = {
                getValue: jest.fn((field) => {
                    if (field === 'companyname') return 'New Company Inc.';
                    if (field === 'email') return 'contact@newcompany.com';
                    return null;
                }),
                id: '12345'
            };

            const scriptContext = {
                type: 'create',
                newRecord: mockRecord
            };

            const afterSubmit = (context) => {
                if (context.type === 'create') {
                    const companyName = context.newRecord.getValue('companyname');
                    const email = context.newRecord.getValue('email');
                    
                    log.audit({
                        title: 'Customer Created Successfully',
                        details: {
                            customerId: context.newRecord.id,
                            companyName: companyName,
                            email: email,
                            timestamp: new Date().toISOString()
                        }
                    });

                    // Could trigger additional workflows here
                    // e.g., send welcome email, create default records, etc.
                }
            };

            afterSubmit(scriptContext);

            expect(log.audit).toHaveBeenCalledWith({
                title: 'Customer Created Successfully',
                details: {
                    customerId: '12345',
                    companyName: 'New Company Inc.',
                    email: 'contact@newcompany.com',
                    timestamp: expect.any(String)
                }
            });
        });

        it('should handle customer update events', () => {
            const mockOldRecord = {
                getValue: jest.fn().mockReturnValue('old@company.com')
            };

            const mockNewRecord = {
                getValue: jest.fn().mockReturnValue('new@company.com'),
                id: '12345'
            };

            const scriptContext = {
                type: 'edit',
                oldRecord: mockOldRecord,
                newRecord: mockNewRecord
            };

            const afterSubmit = (context) => {
                if (context.type === 'edit') {
                    const oldEmail = context.oldRecord.getValue('email');
                    const newEmail = context.newRecord.getValue('email');
                    
                    if (oldEmail !== newEmail) {
                        log.audit({
                            title: 'Customer Email Updated',
                            details: {
                                customerId: context.newRecord.id,
                                oldEmail: oldEmail,
                                newEmail: newEmail
                            }
                        });
                    }
                }
            };

            afterSubmit(scriptContext);

            expect(log.audit).toHaveBeenCalledWith({
                title: 'Customer Email Updated',
                details: {
                    customerId: '12345',
                    oldEmail: 'old@company.com',
                    newEmail: 'new@company.com'
                }
            });
        });
    });
});