/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget'],
    
    (serverWidget) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            const form=serverWidget.createForm({
                title:'Avera MX'
            })
            const greetingField=form.addField({
                id: 'greeting',
                label: 'Saludo',
                type: serverWidget.FieldType.INLINEHTML
            });
            greetingField.defaultValue='Holi :D'
            scriptContext.response.writePage(form)
        }

        return {onRequest}

    });
