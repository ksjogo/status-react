function validateSend(params, context) {
    if (!context.to) {
        return {
            markup: status.components.validationMessage(
                "Wrong address",
                "Recipient address must be specified"
            )
        };
    }
    if (!params.amount) {
        return {
            markup: status.components.validationMessage(
                I18n.t('validation_title'),
                I18n.t('validation_amount_specified')
            )
        };
    }

    var amount = params.amount.replace(",", ".");
    var amountSplitted = amount.split(".");
    if (amountSplitted.length === 2 && amountSplitted[1].length > 18) {
        return {
            markup: status.components.validationMessage(
                I18n.t('validation_title'),
                I18n.t('validation_amount_is_too_small')
            )
        };
    }

    try {
        var val = web3.toWei(amount, "ether");
        if (val <= 0) {
            throw new Error();
        }
    } catch (err) {
        return {
            markup: status.components.validationMessage(
                I18n.t('validation_title'),
                I18n.t('validation_invalid_number')
            )
        };
    }

    var balance = web3.eth.getBalance(context.from);
    var estimatedGas = web3.eth.estimateGas({
        from: context.from,
        to: context.to,
        value: val
    });

    if (bn(val).plus(bn(estimatedGas)).greaterThan(bn(balance))) {
        return {
            markup: status.components.validationMessage(
                I18n.t('validation_title'),
                I18n.t('validation_insufficient_amount')
                + web3.fromWei(balance, "ether")
                + " ETH)"
            )
        };
    }
}

function handleSend(params, context) {
    var data = {
        from: context.from,
        to: context.to,
        value: web3.toWei(params.amount.replace(",", "."), "ether")
    };

    try {
        return web3.eth.sendTransaction(data);
    } catch (err) {
        return {error: err.message};
    }
}

function round(n) {
    return Math.round(n * 100) / 100;
}

function amountParameterBox(params, context) {
    /*var balance = parseFloat(web3.fromWei(web3.eth.getBalance(context.from), "ether"));
    var defaultSliderValue = balance / 2;*/

    //var gasPrice = web3.eth.gasPrice();

    status.defineSubscription(
        "roundedValue",
        {value: ["sliderValue"]},
        function (params) {
            return round(params.value);
        }
    );

    status.setDefaultDb({
        sliderValue: 10
    });

    return {
        title: "Send transaction",
        showBack: true,
        markup: status.components.view(
            {
                flex: 1
            },
            [
                status.components.text(
                    {
                        style: {
                            fontSize: 14,
                            color: "rgb(147, 155, 161)",
                            paddingTop: 12,
                            paddingLeft: 16,
                            paddingRight: 16,
                            paddingBottom: 12
                        }
                    },
                    "Specify amount"
                ),
                status.components.view(
                    {
                        flexDirection: "row",
                        alignItems: "center",
                        textAlign: "center",
                        justifyContent: "center"
                    },
                    [
                        status.components.text(
                            {
                                font: "light",
                                style: {
                                    fontSize: 38,
                                    marginLeft: 8,
                                    color: "black"
                                }
                            },
                            "2.00"
                        ),
                        status.components.text(
                            {
                                font: "light",
                                style: {
                                    fontSize: 38,
                                    marginLeft: 8,
                                    color: "rgb(147, 155, 161)"
                                }
                            },
                            "ETH"
                        ),
                    ]
                ),
                status.components.text(
                    {
                        style: {
                            fontSize: 14,
                            color: "rgb(147, 155, 161)",
                            paddingTop: 16,
                            paddingLeft: 16,
                            paddingRight: 16,
                            paddingBottom: 8
                        }
                    },
                    "Fee"
                ),
                status.components.view(
                    {
                        flexDirection: "row"
                    },
                    [
                        status.components.text(
                            {
                                style: {
                                    fontSize: 14,
                                    color: "black",
                                    paddingLeft: 16
                                }
                            },
                            "0.05"
                        ),
                        status.components.text(
                            {
                                style: {
                                    fontSize: 14,
                                    color: "rgb(147, 155, 161)",
                                    paddingLeft: 4,
                                    paddingRight: 4
                                }
                            },
                            "ETH"
                        )
                    ]
                ),
                status.components.slider(
                    {
                        maximumValue: 20,
                        value: 10,
                        minimumValue: 0,
                        onSlidingComplete: status.components.dispatch(
                            [status.events.UPDATE_DB, "sliderValue"]
                        ),
                        step: 0.05,
                        style: {
                            marginLeft: 16,
                            marginRight: 16
                        }
                    }
                ),
                status.components.view(
                    {
                        flexDirection: "row"
                    },
                    [
                        status.components.text(
                            {
                                style: {
                                    flex: 1,
                                    fontSize: 14,
                                    color: "rgb(147, 155, 161)",
                                    paddingLeft: 16,
                                    alignSelf: "flex-start"
                                }
                            },
                            "Cheaper"
                        ),
                        status.components.text(
                            {
                                style: {
                                    flex: 1,
                                    fontSize: 14,
                                    color: "rgb(147, 155, 161)",
                                    paddingRight: 16,
                                    alignSelf: "flex-end",
                                    textAlign: "right"
                                }
                            },
                            "Faster"
                        )
                    ]
                ),
            ]
        )
    };
}

var paramsSend = [
    {
        name: "recipient",
        type: status.types.TEXT,
        suggestions: function (params) {
            return {
                title: "Send transaction",
                markup: status.components.chooseContact("Choose recipient", 0)
            };
        }
    },
    {
        name: "amount",
        type: status.types.NUMBER,
        suggestions: amountParameterBox
    }
];

var send = {
    name: "send",
    icon: "money_white",
    color: "#5fc48d",
    title: I18n.t('send_title'),
    description: I18n.t('send_description'),
    params: paramsSend,
    preview: function (params, context) {
        var amountStyle = {
            fontSize: 36,
            color: "#000000",
            height: 40
        };

        var amount = status.components.view(
            {
                flexDirection: "column",
                alignItems: "flex-end",
            },
            [status.components.text(
                {
                    style: amountStyle,
                    font: "light"
                },
                status.localizeNumber(params.amount, context.delimiter, context.separator)
            )]);

        var currency = status.components.view(
            {
                style: {
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    paddingBottom: 0
                }
            },
            [status.components.text(
                {
                    style: {
                        color: "#9199a0",
                        fontSize: 16,
                        lineHeight: 18,
                        marginLeft: 7.5
                    }
                },
                "ETH"
            )]
        );

        return {
            markup: status.components.view(
                {
                    style: {
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 8,
                        marginBottom: 8
                    }
                },
                [amount, currency]
            )
        };
    },
    shortPreview: function (params, context) {
        return {
            markup: status.components.text(
                {},
                I18n.t('send_title') + ": "
                + status.localizeNumber(params.amount, context.delimiter, context.separator)
                + " ETH"
            )
        };
    },
    handler: handleSend,
    validator: validateSend
};

status.command(send);
status.response(send);

status.command({
    name: "request",
    color: "#5fc48d",
    title: I18n.t('request_title'),
    description: I18n.t('request_description'),
    sequentialParams: true,
    params: [{
        name: "amount",
        type: status.types.NUMBER
    }],
    handler: function (params) {
        return {
            event: "request",
            params: [params.amount],
            request: {
                command: "send",
                params: {
                    amount: params.amount
                }
            }
        };
    },
    preview: function (params, context) {
        return {
            markup: status.components.text(
                {},
                I18n.t('request_requesting') + " "
                + status.localizeNumber(params.amount, context.delimiter, context.separator)
                + " ETH"
            )
        };
    },
    shortPreview: function (params, context) {
        return {
            markup: status.components.text(
                {},
                I18n.t('request_requesting') + " "
                + status.localizeNumber(params.amount, context.delimiter, context.separator)
                + " ETH"
            )
        };
    },
    validator: function (params) {
        try {
            var val = web3.toWei(params.amount.replace(",", "."), "ether");
            if (val <= 0) {
                throw new Error();
            }
        } catch (err) {
            return {
                markup: status.components.validationMessage(
                    I18n.t('validation_title'),
                    I18n.t('validation_invalid_number')
                )
            };
        }
    }
});
