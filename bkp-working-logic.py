# Initialize tracking variables
total_shares = 0
total_investment = 0
avg_price = 0
prev_week_high = None
active_buys = []

updated_rows = []
weekIdx = 0
prev_year = None

# Process year-wise and then week-wise
for (year, week), group in df.groupby(['Year', 'Week']):
    
    # Reset tracking variables when the year changes
    if prev_year is None or prev_year != year:
        prev_week_high = None
        weekIdx = 0  # Reset week index for new year
    
    weekIdx += 1
    weekly_high = group['HIGH'].max()
    weekly_low = group['LOW'].min()

    
    for _, row in group.iterrows():
        if weekIdx == 1:
            prev_week_high = weekly_high
            updated_rows.append({**row})
            continue  # Skip first week of each year

        if row['Day'] == "WEEKLY SUMMARY":
            updated_rows.append({ **row })
            continue
        
        # Sell condition
        if total_shares > 0 and row['HIGH'] >= avg_price * TARGET_MULTIPLIER:
            sell_price = avg_price * TARGET_MULTIPLIER
            profit = (sell_price - avg_price) * total_shares

            updated_rows.append({
                **row,
                "Order Type": "SELL",
                "Buy Quantity": "",
                "Investment": "",
                "Total Share": 0,
                "Total Investment": 0,
                "Average Price": "",
                "Target": "",
                "IRLower": "",
                "IRUpper": "",
                "Description": f"Sold {total_shares} shares at {sell_price}, Profit: {profit}",
                "Profit": profit,
                "Capital Employed": total_shares * sell_price,
                "Profit Percentage": (profit / (total_shares * avg_price)) * 100 
            })

            total_shares = 0
            total_investment = 0
            avg_price = 0
            active_buys = []
            continue

        # Determine buy price
        if total_shares == 0:
            if row['LOW'] <= prev_week_high and prev_week_high <= row['HIGH']: 
                buy_price = prev_week_high
                buy_reason = "Prev week high - Buy price"
            else:
                updated_rows.append({
                    **row,
                    "Order Type": "NOTHING",
                })
                continue
        else:
            if row['LOW'] <= LOWER_MULTIPLIER * avg_price:
                buy_price = LOWER_MULTIPLIER * avg_price
                buy_reason = "LOWER - Buy Triggered at IRLower"
            elif row['HIGH'] >= UPPER_MULTIPLIER * avg_price:
                buy_price = UPPER_MULTIPLIER * avg_price
                buy_reason = "UPPER - Buy Triggered at IRUpper"
            else:
                updated_rows.append({**row, buy_reason: "OUT_OF_RANGE"})
                continue

        can_buy_this_week = False
        
        buy_quantity = math.floor(INVESTMENT_PER_TRADE / buy_price)
        investment = buy_quantity * buy_price

        total_shares += buy_quantity
        total_investment += investment
        avg_price = total_investment / total_shares

        target_price = avg_price * TARGET_MULTIPLIER
        upper_range = avg_price * UPPER_MULTIPLIER
        lower_range = avg_price * LOWER_MULTIPLIER

        
        active_buys.append({
            "Order Type": "BUY",
            "Year": year,
            "Week": week,
            "Buy Price": buy_price,
            "Buy Quantity": buy_quantity,
            "Investment": investment,
            "Total Shares": total_shares,
            "Total Investment": total_investment,
            "Avg Price": avg_price,
            "Target": target_price,
            "IRLower": lower_range,
            "IRUpper": upper_range,
            "Description": buy_reason
        })
        
        updated_rows.append({
            **row,
            "Order Type": "BUY",
            "Buy Quantity": buy_quantity,
            "Investment": investment,
            "Total Share": total_shares,
            "Total Investment": total_investment,
            "Average Price": avg_price,
            "Target": target_price,
            "IRLower": lower_range,
            "IRUpper": upper_range,
            "Description": buy_reason
        })
    
    prev_week_high = weekly_high
    prev_year = year  # Update year tracker

# Create new DataFrame with updated data
df_updated = pd.DataFrame(updated_rows)
df = df_updated