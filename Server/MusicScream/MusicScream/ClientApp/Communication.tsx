import * as $ from 'jquery';

export class Communication
{
    public static ajax(options: any)
    {
        const successFunction = options.success;
        const errorFunction = options.error;


        options.error = function(data: any, ajaxOptions: any, thrownError: any)
            {
                if (errorFunction)
                    errorFunction(data, ajaxOptions, thrownError);
            };
        
        options.success = function(data: any, ajaxOptions: any, thrownError: any)
            {
                if (successFunction)
                    successFunction(data, ajaxOptions, thrownError);
            };
        $.ajax(options);
    }

    public static getFullUrl(relativeUrl: string)
    {
        return relativeUrl;
    }

    public static simpleAjax(url: string, onSuccess?: ((data: any) => void), onError?: ((data: any) => void))
    {
        Communication.ajax(
            {
                url: url,
                success: function(data: any)
                {
                    if (onSuccess)
                        onSuccess(data);
                },
                error: function(data: any)
                {
                    if (onError)
                        onError(data);
                }
            }
        );
    }

    public static simpleAjaxPromise(url: string) : Promise<any>
    {
        return new Promise((resolve, reject) =>
        {
            this.simpleAjax(url, resolve, reject);
        });
    }

    public static getJson(url: string, onSuccess?: ((data: any) => void))
    {
        $.getJSON(url, onSuccess);
    }

    public static getJsonPromise(url: string) : Promise<any>
    {
        return new Promise((resolve) => 
        {
            $.getJSON(url, resolve);
        });
    }

    public static ajaxPost(url: string, formData: FormData, onSuccess?: ((data: any) => void), onError?: ((data: any) => void))
    {
        Communication.ajax(
            {
                url: url,
                data: formData,
                processData: false,
                contentType: false,
                type: 'POST',
                success: function(data: any)
                {
                    if (onSuccess)
                        onSuccess(data);
                },
                error: function(data: any)
                {
                    if (onError)
                        onError(data);
                }
            }
        );
    }

    public static ajaxPostJson(url: string, data: any, onSuccess?: ((data: any) => void), onError?: ((data: any) => void))
    {
        Communication.ajax(
            {
                url: url,
                data: JSON.stringify(data),
                contentType: 'application/json; charset=utf-8',
                type: 'POST',
                success: function(data: any)
                {
                    if (onSuccess)
                        onSuccess(data);
                },
                error: function(data: any)
                {
                    if (onError)
                        onError(data);
                }
            }
        );
    }

    public static ajaxPostJsonPromise(url: string, data: any) : Promise<any>
    {
        return new Promise((resolve, reject) =>
        {
            this.ajaxPostJson(url, data, resolve, reject);
        });
    }
}