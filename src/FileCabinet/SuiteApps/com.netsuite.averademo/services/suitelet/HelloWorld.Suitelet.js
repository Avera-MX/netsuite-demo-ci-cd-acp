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
            greetingField.defaultValue=`
            <div style="text-align: center; font-family: 'Arial', sans-serif; background-color: #f0f8ff; padding: 50px; border-radius: 15px; border: 2px solid #add8e6; color: #333;">
            <h1 style="color: #4682b4; font-size: 3em; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">Hello, World!</h1>
            <p style="font-size: 1.2em; color: #555;">Made with ❤️ by the Avera Engineering Team.</p>
            </div>`
            scriptContext.response.writePage(form)
        }

        return {onRequest}

    });
