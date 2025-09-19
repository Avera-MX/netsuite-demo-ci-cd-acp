import record from 'N/record';
import Record from 'N/record/instance';

jest.mock('N/record');
jest.mock('N/record/instance');

describe('NetSuite Record Operations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Customer Record Operations', () => {
        it('should create new customer record', () => {
            const mockCustomerRecord = {
                setValue: jest.fn(),
                save: jest.fn().mockReturnValue(12345)
            };

            record.create.mockReturnValue(mockCustomerRecord);

            // Create customer
            const customerRecord = record.create({
                type: record.Type.CUSTOMER
            });

            customerRecord.setValue({
                fieldId: 'companyname',
                value: 'Test Company Inc.'
            });

            customerRecord.setValue({
                fieldId: 'email',
                value: 'test@company.com'
            });

            const customerId = customerRecord.save();

            expect(record.create).toHaveBeenCalledWith({
                type: record.Type.CUSTOMER
            });
            expect(mockCustomerRecord.setValue).toHaveBeenCalledWith({
                fieldId: 'companyname',
                value: 'Test Company Inc.'
            });
            expect(mockCustomerRecord.setValue).toHaveBeenCalledWith({
                fieldId: 'email',
                value: 'test@company.com'
            });
            expect(customerId).toBe(12345);
        });

        it('should load and update existing customer', () => {
            const customerId = 54321;
            const mockCustomerRecord = {
                getValue: jest.fn(),
                setValue: jest.fn(),
                save: jest.fn().mockReturnValue(customerId)
            };

            record.load.mockReturnValue(mockCustomerRecord);
            mockCustomerRecord.getValue.mockReturnValue('Old Company Name');

            // Load customer
            const customerRecord = record.load({
                type: record.Type.CUSTOMER,
                id: customerId
            });

            const currentName = customerRecord.getValue('companyname');
            
            customerRecord.setValue({
                fieldId: 'companyname',
                value: 'Updated Company Name'
            });

            const updatedId = customerRecord.save();

            expect(record.load).toHaveBeenCalledWith({
                type: record.Type.CUSTOMER,
                id: customerId
            });
            expect(mockCustomerRecord.getValue).toHaveBeenCalledWith('companyname');
            expect(currentName).toBe('Old Company Name');
            expect(updatedId).toBe(customerId);
        });
    });

    describe('Sales Order Operations', () => {
        it('should create sales order with line items', () => {
            const mockSalesOrder = {
                setValue: jest.fn(),
                setSublistValue: jest.fn(),
                save: jest.fn().mockReturnValue(98765)
            };

            record.create.mockReturnValue(mockSalesOrder);

            // Create sales order
            const salesOrder = record.create({
                type: record.Type.SALES_ORDER
            });

            salesOrder.setValue({
                fieldId: 'entity',
                value: 12345 // customer ID
            });

            salesOrder.setValue({
                fieldId: 'memo',
                value: 'Test sales order created via Jest'
            });

            // Add line item
            salesOrder.setSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: 0,
                value: 111 // item ID
            });

            salesOrder.setSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: 0,
                value: 5
            });

            const orderId = salesOrder.save();

            expect(record.create).toHaveBeenCalledWith({
                type: record.Type.SALES_ORDER
            });
            expect(mockSalesOrder.setValue).toHaveBeenCalledWith({
                fieldId: 'entity',
                value: 12345
            });
            expect(mockSalesOrder.setSublistValue).toHaveBeenCalledWith({
                sublistId: 'item',
                fieldId: 'item',
                line: 0,
                value: 111
            });
            expect(orderId).toBe(98765);
        });
    });

    describe('Item Record Operations', () => {
        it('should create inventory item', () => {
            const mockItem = {
                setValue: jest.fn(),
                save: jest.fn().mockReturnValue(777)
            };

            record.create.mockReturnValue(mockItem);

            const item = record.create({
                type: record.Type.INVENTORY_ITEM
            });

            item.setValue({
                fieldId: 'itemid',
                value: 'TEST-ITEM-001'
            });

            item.setValue({
                fieldId: 'displayname',
                value: 'Test Inventory Item'
            });

            item.setValue({
                fieldId: 'cost',
                value: 25.99
            });

            const itemId = item.save();

            expect(record.create).toHaveBeenCalledWith({
                type: record.Type.INVENTORY_ITEM
            });
            expect(mockItem.setValue).toHaveBeenCalledWith({
                fieldId: 'itemid',
                value: 'TEST-ITEM-001'
            });
            expect(itemId).toBe(777);
        });
    });
});