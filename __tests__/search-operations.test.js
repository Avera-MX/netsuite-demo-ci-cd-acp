import search from 'N/search';

jest.mock('N/search');

describe('NetSuite Search Operations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Customer Search', () => {
        it('should search for customers by company name', () => {
            const mockResultSet = {
                each: jest.fn().mockImplementation((callback) => {
                    // Simulate search results
                    const result1 = {
                        id: '123',
                        getValue: jest.fn().mockReturnValue('ABC Corp')
                    };
                    const result2 = {
                        id: '456', 
                        getValue: jest.fn().mockReturnValue('XYZ Inc')
                    };
                    
                    callback(result1, 0);
                    callback(result2, 1);
                    return false; // Stop iteration
                })
            };

            const mockSearch = {
                run: jest.fn().mockReturnValue(mockResultSet)
            };

            search.create.mockReturnValue(mockSearch);

            // Create customer search
            const customerSearch = search.create({
                type: search.Type.CUSTOMER,
                filters: [
                    ['companyname', search.Operator.CONTAINS, 'Corp']
                ],
                columns: [
                    'companyname',
                    'email',
                    'phone'
                ]
            });

            const searchResultSet = customerSearch.run();
            const customers = [];

            searchResultSet.each((result) => {
                customers.push({
                    id: result.id,
                    companyname: result.getValue('companyname')
                });
                return true;
            });

            expect(search.create).toHaveBeenCalledWith({
                type: search.Type.CUSTOMER,
                filters: [
                    ['companyname', search.Operator.CONTAINS, 'Corp']
                ],
                columns: [
                    'companyname',
                    'email', 
                    'phone'
                ]
            });
            expect(mockSearch.run).toHaveBeenCalled();
            expect(customers).toHaveLength(2);
            expect(customers[0].id).toBe('123');
        });

        it('should get paginated search results', () => {
            const mockPagedData = {
                count: 250,
                pageRanges: [{
                    index: 0,
                    size: 50
                }],
                fetch: jest.fn().mockReturnValue({
                    data: [
                        { id: '1', values: { companyname: 'Company A' }},
                        { id: '2', values: { companyname: 'Company B' }}
                    ]
                })
            };

            const mockSearch = {
                runPaged: jest.fn().mockReturnValue(mockPagedData)
            };

            search.create.mockReturnValue(mockSearch);

            const customerSearch = search.create({
                type: search.Type.CUSTOMER,
                columns: ['companyname']
            });

            const pagedData = customerSearch.runPaged({
                pageSize: 50
            });

            const firstPage = pagedData.fetch({ index: 0 });

            expect(pagedData.count).toBe(250);
            expect(firstPage.data).toHaveLength(2);
            expect(mockPagedData.fetch).toHaveBeenCalledWith({ index: 0 });
        });
    });

    describe('Transaction Search', () => {
        it('should search sales orders by date range', () => {
            const mockResultSet = {
                each: jest.fn().mockImplementation((callback) => {
                    const result = {
                        id: 'SO123',
                        getValue: jest.fn((field) => {
                            if (field === 'tranid') return 'SO-2024-001';
                            if (field === 'total') return '1500.00';
                            return null;
                        })
                    };
                    callback(result, 0);
                    return false;
                })
            };

            const mockSearch = {
                run: jest.fn().mockReturnValue(mockResultSet)
            };

            search.create.mockReturnValue(mockSearch);

            const transactionSearch = search.create({
                type: search.Type.SALES_ORDER,
                filters: [
                    ['trandate', search.Operator.WITHIN, ['2024-01-01', '2024-12-31']],
                    'AND',
                    ['status', search.Operator.ANYOF, ['SalesOrd:A', 'SalesOrd:B']]
                ],
                columns: [
                    'tranid',
                    'trandate',
                    'entity',
                    'total'
                ]
            });

            const results = transactionSearch.run();
            const orders = [];

            results.each((result) => {
                orders.push({
                    id: result.id,
                    tranid: result.getValue('tranid'),
                    total: result.getValue('total')
                });
                return true;
            });

            expect(search.create).toHaveBeenCalledWith({
                type: search.Type.SALES_ORDER,
                filters: [
                    ['trandate', search.Operator.WITHIN, ['2024-01-01', '2024-12-31']],
                    'AND',
                    ['status', search.Operator.ANYOF, ['SalesOrd:A', 'SalesOrd:B']]
                ],
                columns: [
                    'tranid',
                    'trandate',
                    'entity',
                    'total'
                ]
            });
            expect(orders[0].tranid).toBe('SO-2024-001');
        });
    });

    describe('Saved Search', () => {
        it('should load and run existing saved search', () => {
            const mockResultSet = {
                each: jest.fn().mockReturnValue(false)
            };

            const mockSavedSearch = {
                run: jest.fn().mockReturnValue(mockResultSet)
            };

            search.load.mockReturnValue(mockSavedSearch);

            const savedSearch = search.load({
                id: 'customsearch_customer_report'
            });

            const results = savedSearch.run();

            expect(search.load).toHaveBeenCalledWith({
                id: 'customsearch_customer_report'
            });
            expect(mockSavedSearch.run).toHaveBeenCalled();
        });
    });
});