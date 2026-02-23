from chatbot.engine import ChatbotEngine

bot = ChatbotEngine()
print("Live weather output:")
res = bot.get_live_weather('9.7500', '125.5000')
print(res)

print("Process message output:")
res2 = bot.process_message("what is the weather")
print(res2)
